/**
 * Created by CooTek on 2015/7/10.
 */

$(document).ready(function () {
    $("#json-affix").affix({
        offset: {
            top: $('#json-affix').offset().top,
            bottom: $('#footer').outerHeight() + 60
        }
    });

    $('[data-toggle="tooltip"]').tooltip();

    window.onscroll = function() {
        var top = document.body.scrollTop || document.documentElement.scrollTop;
        if ( top >= 100 ) {
            $('#header-nav').addClass('display-none');
        } else {
            $('#header-nav').removeClass('display-none');
        }

    };
});


/* ---------- Angular 数据绑定部分 --------- */
var app = angular.module('cootek-json', []);

var TEXTAREA_DEFAULT_ROWS = 3;
var TEXTAREA_EDITING_ROWS = 25;
var sectionTitles = {
    'wuxichen1': '推荐项目',
    'wuxichen2': '我的订单',
    'wuxichen3': '猜你喜欢',
    'wuxichen4': '分割符',
    'wuxichen5': '线下服务',
    'wuxichen6': '优惠券'
};
var sectionOrder = {};
var ID_COUNT = 1;
requiredItem = {};

/**
 * 根据section中的type作为其中元素的 id前缀，若无type则用 Cootek123 这种格式
 *
 * @param sectionObj -- $scope.jsonCodeSections[0/1/2..]的元素
 * @returns {*} -- id前缀
 */
function getIdPrefix(sectionObj) {
    if (sectionObj && sectionObj.type) {
        return sectionObj.type;
    } else {
        return 'Cootek' + ID_COUNT++;
    }
}


/**
 * 根据ng-model字符串，判断该model是否存在于requiredItem
 *
 * @param ngModelString
 * @returns {boolean}
 */
function inRequiredItemByModel(ngModelString) {
    var reg = /\[(\w+)\]|\['(\w+)'\]/g;
    var valueArr = [];
    var item = null;

    while ((item = reg.exec(ngModelString)) !== null) {
        valueArr.push( item[1] || item[2] );
    }
    return inRequiredItemByValueArray(valueArr);
}

/**
 * 根据id判断，该id是否存在于requiredItem总
 *
 * @param idString
 * @returns {boolean}
 */
function inRequiredItemById(idString) {
    return inRequiredItemByModel( getModelStringByIdString(idString) );
}

/**
 * 根据属性名组成的数组，判断是否存在于requiredItem
 *
 * @param arr
 * @returns {boolean}
 */
function inRequiredItemByValueArray(arr) {
    var subRequiredItem = requiredItem;

    for (var i = 0; i < arr.length; i++) {
        if ( subRequiredItem[ arr[i] ] !== undefined ) {
            subRequiredItem = subRequiredItem[ arr[i] ];
        } else if ( $.isArray(subRequiredItem) && subRequiredItem[0] !== undefined ){
            // 必填项对象为一个数组，且只有一个元素，则该数组所有元素都用 必填项对象[0] 的必填规则
            subRequiredItem = subRequiredItem[0];
        } else {
            return false;
        }
    }

    return true;
}

/**
 * 通过元素id，得到该元素绑定的ng-model值的字符串，如#search-filter-os --> 'jsonCodeSections[0][filter][os]'
 * @param idString
 * @returns {string}    ng-model的字符串
 */
function getModelStringByIdString(idString) {
    var arr = idString.split('-');
    var modelString = 'jsonCodeSections[' + sectionOrder[arr[0]] + ']';
    for (var i = 1, len = arr.length; i < len; i++) {
        modelString += '[\'' + arr[i] + '\']';
    }
    return modelString;
}

/**
 * cootek-json Module初始化配置
 */
//app.run( function($scope) {
//
//    // 默认不在服务器端运行
//    $scope.isServer = false;
//
//} );


app.controller('IndexJSONController', function ($scope, $compile, $timeout) {

    // 初始化json数据、其他配置
    $scope.jsoncodeEditable = true;
    $scope.jsonCode = getJSONCode();
    $scope.jsonCodeString = getJSONString($scope.jsonCode);
    $scope.jsonCodeSections = $scope.jsonCode['sections'];

    $scope.showSuccessLabel = false;
    $scope.showErrorLabel = false;
    $scope.successLabel = '';
    $scope.errorLabel = '';

    // 根据每个section的type，获取sectionTitles中相应的title
    $scope.getSectionTitle = function (type) {
        if (sectionTitles[type]) {
            return sectionTitles[type];
        } else {
            return '';
        }
    };

    // JSON代码输入框 的事件响应函数
    $scope.textAreaFocus = function ($event) {
        $event.target.rows = TEXTAREA_EDITING_ROWS;
    };
    $scope.textAreaBlur = function ($event) {
        $event.target.rows = TEXTAREA_DEFAULT_ROWS;
    };

    // 代码显示框中 编辑按钮响应事件
    $scope.editJsonCode = function () {
        $scope.jsoncodeEditable = true;
        setTimeout(function () {
            $('#jsoncodetext').focus()
        }, 10);
    };

    // 代码显示框中 复制响应事件
    $scope.copyJsonCode = function (event) {
        var textarea = $('#jsoncodetext')[0];

        if (typeof textarea.setSelectionRange !== 'undefined') {

            $scope.jsoncodeEditable = true;
            textarea.setSelectionRange(0, textarea.value.length);
            showSuccessLabel('全选成功 请使用Ctrl+C', 5);
            setTimeout(function () {
                textarea.focus();
            }, 10);

        } else {

            event.currentTarget.setAttribute('data-original-title', '请全选后按"Ctrl+C"');
            $('.glyphicon-paste').tooltip('show');
            event.currentTarget.setAttribute('data-original-title', '复制');
        }
    };

    // -----------------------------------------
    // 生成JSON代码 按钮
    $scope.generateCode = function () {

        if (checkForm()) {

            $scope.jsonCodeString = getJSONString($scope.jsonCode);
            $scope.jsoncodeEditable = false;
            showSuccessLabel('JSON代码生成成功！', 3);
        } else {

            showErrorLabel('必填项尚未完全填写！');
        }
    };

    // 生成DOM结构 按钮
    $scope.generateDOM = function () {
        $scope.jsonCode = JSON.parse($scope.jsonCodeString);
        $scope.jsonCodeSections = $scope.jsonCode['sections'];

        updateAllDOMElements();
        updateSidebarNav();

        showSuccessLabel('成功由JSON代码生成结构！', 7);
    };

    // 是与否二选一的Radio，点击事件
    $scope.chooseRadio = function(idString, value) {
        var parentIdString = idString.split('-').slice(0,-1).join('-');
        var key = idString.split('-').slice(-1);
        var modelParent = getModelByIdString(parentIdString);
        modelParent[key] = Boolean(value);
    }


    // ------------------------------------------
    // “增加item” 按钮 点击响应处理函数
    $scope.addItemClick = function (event, isArray) {
        $scope.addItem = {
            'isArray': Boolean(isArray)
        };
        $scope.addItemParent = event.currentTarget.parentNode.parentNode || null;
    }

    // ------------------------------------------
    // 新增item 模态框部分
    $scope.addItem = {};
    $scope.addItemParent = null;

    // “确认”按钮 点击响应函数
    $scope.addConfirm = function () {
        if ($scope.addItemParent === null
            || (parseInt($scope.addItem.type) > 3 || parseInt($scope.addItem.type) < 0)) {
            return;
        }
        $scope.addItem.key = $scope.addItem.key || '';

        var parentModel = getModelByIdString($scope.addItemParent.id);
        var key = $scope.addItem.key || parentModel.length;

        // 插入新变量到Model中
        if (insertVariableToModel($scope.addItem.type, key, parentModel)) {

            // 更新增加部分的DOM树
            updateDOMElements(
                $scope.addItemParent,
                $scope.addItemParent.id
            );

            // 更新导航
            updateSidebarNav();

        } else {
            // 如果新的变量已经存在，则提示
            showErrorLabel('无法添加相同名称的item');
        }

    };

    //修改item索引
    $scope.changeItemClick = function (event, idString) {
        $scope.toChangeElement = event.currentTarget.parentNode.parentNode || null;
        $scope.changeItemParent = event.target.parentNode || null;
        $scope.changeItemIndexType=idString.split("-");
        $scope.changeItemIndex=idString||'';
        $('#item-change').find('input').attr('placeholder',$scope.changeItemIndexType[$scope.changeItemIndexType.length-1]);
        $('#item-change').find('input').val('');
        }

    // ------------------------------------------
    // 修改item 模态框部分
    $scope.changeItem = {};
    $scope.changeItemParent=null;
    $scope.changeItemIndex='';
    $scope.changeItemIndexType=[];

    // “确认”按钮 点击响应函数
    $scope.changeConfirm = function () {
        if ($scope.changeItemParent === null) {
            return;
        }
       console.log($('#item-change').find('input').attr('placeholder'));
       if($('#item-change').find('input').val()==='')
         $scope.changeItem.key=$('#item-change').find('input').attr('placeholder');
        console.log('----------------');
        console.log($scope.changeItem.key);
        updateModelById($scope.changeItemIndex, $scope.changeItem.key);
        updateDOMElements(
            $scope.toChangeElement.parentNode,
            $scope.changeItemIndex.split('-').slice(0, -1).join('-')
        );
        // 更新导航
        updateSidebarNav();
    }

    //----------------------------------------
    // “删除”按钮 点击响应事件
    $scope.deleteItemClick = function (event, idString) {
        $scope.toDeleteElement = event.currentTarget.parentNode.parentNode || null;
        $scope.toDeleteId = idString || '';
    };

    // ---------------------------------------
    // 删除确认后，事件处理
    $scope.toDeleteElement = null;
    $scope.toDeleteId = '';
    $scope.deleteConfirm = function () {
        console.log('close');
        if ($scope.toDeleteElement === null || $scope.toDeleteId === '') {
            return;
        }

        // 删除对应Model
        deleteModelById($scope.toDeleteId);

        // 更新删除部分的DOM树结构
        updateDOMElements(
            $scope.toDeleteElement.parentNode,
            $scope.toDeleteId.split('-').slice(0, -1).join('-')
        );

        // 更新导航
        updateSidebarNav();

    };


    /**
     * 利用Ajax请求 或者 利用<script\>得到 JSON对象
     */
    function getJSONCode() {

        if ($scope.isServer) {
            // TODO $http获取json文件内容
        } else {
            $scope.jsonCode = jsonByScript;
        }

        return $scope.jsonCode;
    }


    /**
     * 获取字符串类型的JSONCode，若无参数，则重新读取
     * @param json
     */
    function getJSONString(json) {
        if (!json) {
            if ($scope.jsonCode) {
                json = $scope.jsonCode;
            } else {
                json = getJSONCode();
            }
        }

        json = json || {};
        return JSON.stringify(
            json,
            function (key, value) {
                if (key !== '$$hashKey') {
                    return value;
                } else {
                    return;
                }
            },
            4
        );
    }


    /**
     * 通过元素id，得到该元素绑定的ng-model值，如#search-filter-os --> jsonCodeSections[0][filter][os]
     *
     * @param idString  元素id
     * @returns {*}     返回该元素绑定的ng-model值
     */
    function getModelByIdString(idString) {
        var arr = idString.split('-');
        var model = $scope.jsonCodeSections[sectionOrder[arr[0]]];
        for (var i = 1, len = arr.length; i < len; i++) {
            if (typeof model !== 'undefined') {
                model = model[arr[i]];
                console.log("aa");
            } else {
                return null;
            }
        }

        return model;
    }


    /**
     * 更新ng-model的值，将新元素插入到$scope.jsonCodeSections中
     *
     * @param type      新元素的类型
     * @param key
     * @param parent
     * @return boolean -- 如果key已经存在于parent中，则返回false；其他情况为true
     */
    function insertVariableToModel(type, key, parent) {
        if (typeof parent === 'string') {
            parent = getModelByIdString(parent);
        }

        if (key in parent) {
            return false;
        }

        switch (type) {
            case '0':
                // string or number
                parent[key] = '';
                break;
            case '1':
                // boolean
                parent[key] = true;
                break;
            case '2':
                // array
                parent[key] = [];
                break;
            case '3':
                // object
                parent[key] = {};
                break;
            default:
                break;
        }

        return true;
    }

    /**
     * 更新整个JSON DOM结构
     */
    function updateAllDOMElements() {
        var oldRoot = angular.element('#jsoncode-dom');

        var newRoot = $compile(
            '<section class="module clearfix" ng-repeat="section in jsonCodeSections">'
            + '<div id="{{ section.type }}" class="module-title"><h4>{{ getSectionTitle(section.type) }}模块</h4></div>'
            + '<div id="{{ section.type }}" cootek-json-repeat section-obj="section" section-index="$index" class="clearfix"></div>'
            + '</section>'
        )($scope);

        oldRoot.append(newRoot);
    }

    /**
     * 更新导航栏的结构
     */
    function updateSidebarNav() {
        angular.element('#json-affix-content').replaceWith(
            $compile(
                '<ul id="json-affix-content" class="sidebar-nav nav panel-body">'
                + '<li ng-repeat="section in jsonCodeSections | filter: section.type = \'!separator\'">'
                + '<a ng-href="#{{section.type}}">{{ getSectionTitle(section.type) }}模块</a>'
                + '<ul cootek-json-nav section-obj="section" class="nav"></ul>'
                + '<li></ul>'
            )($scope)
        );
    }

    /**
     * 删除$scope.jsonCode中对应的属性
     */
    function deleteModelById(idString) {
        var idArr = idString.split('-');

        if (idArr.length === 1) {

            // TODO 没有'-'，是第一级，暂未实现

        } else {
            var parentModel = getModelByIdString(idArr.slice(0, -1).join('-'));
            console.log(parentModel);
            if (parentModel && parentModel[idArr[idArr.length - 1]] !== undefined) {
                if ($.isArray(parentModel)) {
                    console.log(parentModel[parseInt(idArr[idArr.length - 1])]);
                    parentModel.splice(parseInt(idArr[idArr.length - 1]), 1);
                } else {
                    console.log(parentModel[idArr[idArr.length - 1]]);

                    delete parentModel[idArr[idArr.length - 1]];

                    delete parentModel[idArr[idArr.length - 1]];

                }
            }
        }
    }

    function updateModelById(idString,key)
    {
        var idArr=idString.split('-');
        if(idArr.length===1)
        {

        }else{
              var parentModel = getModelByIdString( idArr.slice(0,-1).join('-') );
              var parentModelCopy={};

            if (parentModel && parentModel[ idArr[ idArr.length-1 ] ] !== undefined) {
 
                if ($.isArray(parentModel)) {
                    parentModel.splice(parseInt(idArr[idArr.length - 1]), 1);
                } else {
                    for (var parentModelitem in parentModel) {
                        if (idArr[idArr.length - 1] != parentModelitem) {
                            parentModelCopy[parentModelitem] = parentModel[parentModelitem];
                        }
                        else {
                            deleteNodeContent = parentModel[idArr[idArr.length - 1]];
                            parentModelCopy[key] = deleteNodeContent;
                        }
                    }
                    var model = $scope.jsonCodeSections[sectionOrder[idArr[0]]];
                    var arr1 = [];
                    var model1 = $scope.jsonCodeSections[sectionOrder[idArr[0]]];
                    if (idArr.length === 2) {
                        $scope.jsonCodeSections[sectionOrder[idArr[0]]] = parentModelCopy;
                    }
                    else {
                        for (var i = 1, len = idArr.length - 1; i < len; i++) {
                            if (typeof model !== 'undefined') {
                                model = model[idArr[i]];
                                arr1.push(i);
                            } else {
                                return null;
                            }
                        }
                        for (var j = 0, len1 = arr1.length - 1; j < len1; j++) {
                            model1 = model1[idArr[arr1[j]]];
                        }
                        // console.log(model1[idArr[arr1[len1]]]);
                        model1[idArr[arr1[len1]]] = parentModelCopy;
                    }
                    // deleteNodeContent=parentModel[ idArr[ idArr.length-1 ] ];
                    //delete parentModel[ idArr[ idArr.length-1 ] ];
                    //parentModel[key]=deleteNodeContent;
                }
            }
        }
    }

    /**
     * 更新Node结点所对应的 DOM结构（用指令重新编译生成）
     *
     * @param Node      需要重新编译生成的DOM结点
     * @param idString  该结点所对应的id
     */
    function updateDOMElements(Node, idString) {
        if (Node === undefined || idString === undefined) {
            return;
        }

        var modelString = getModelStringByIdString(idString);

        var newNodeString = '<div cootek-json-repeat id="' + idString + '" class="module-content" '
            + 'section-obj="' + modelString + '" '
            + 'model-string="\'' + modelString.replace(/'/g, '\\\'') + '\'" '
            + 'id-string="\'' + idString + '\'"></div>';

        angular.element(Node).replaceWith($compile(newNodeString)($scope));
    }


    /**
     * 显示 操作成功 提示框
     * @param text
     */
    function showSuccessLabel(text, time) {
        $scope.showSuccessLabel = true;
        $scope.successLabel = text || '';
        time = time || 3;

        $timeout(function () {
            $scope.showSuccessLabel = false;
        }, time * 1000);
    }

    /**
     * 显示 操作失败 提示框
     * @param text
     */
    function showErrorLabel(text, time) {
        $scope.showErrorLabel = true;
        $scope.errorLabel = text || '';
        time = time || 3;

        $timeout(function () {
            $scope.showErrorLabel = false;
        }, time * 1000);
    }

    /**
     * 检查表单中的必填项是否都填写，若未填写，则跳转到相应位置
     * @returns {boolean}
     */
    function checkForm() {

        var checkModelObject = function (required, ngModel, idPrefix) {

            if ($.isArray(required) && required.length === 1) {

                // 必填项子列表是数组，且只有一个元素时，其对应的ngModel中数组所有元素都采用此必填规则
                for (var key = 0; key < ngModel.length; key++) {
                    var idString = idPrefix + '-' + key;
                    if (!checkModelObject(required[0], ngModel[key], idString)) {
                        return false;
                    }
                }

            } else {

                for (var key in required) {
                    if ( required.hasOwnProperty(key) ) {

                        var idString = idPrefix + '-' + key;

                        if (ngModel[key] === undefined) {
                            window.location.hash = '#'+idString;
                            $('#'+idString)[0].focus();
                            return false;
                        }

                        if (!checkModelObject(required[key], ngModel[key], idString)) {
                            return false;
                        }
                    }
                }
            }

            return true;
        };

        for (var key in requiredItem) {
            if ( requiredItem.hasOwnProperty(key) ) {
                if ( !checkModelObject(requiredItem[key], $scope.jsonCodeSections[key], $scope.jsonCodeSections[key]['type']) ) {
                    return false;
                }
            }
        }
        return true;
    }


});


app.directive('cootekJsonRepeat', function ($compile) {


    return {
        restrict: 'EA',
        replace: true,
        scope: {
            sectionObj: '=',
            sectionIndex: '=',
            modelString: '=',
            idString: '='
        },
        link: function (scope, ele) {

            var idPrefix = scope.idString === undefined ? getIdPrefix(scope.sectionObj) : scope.idString;
            //var tplEl = angular.element('<div id="' + idPrefix + '" class="clearfix"></div>');
            var tplEl = angular.element(ele);

            // 由于顶层(sections=[...])是数组，为了给其每个元素起名称，所以维护一张表sectionOrder
            // 若指令需要构建顶层元素，则需要在sectionOrder中加入 index与名称的对应关系
            if (scope.sectionIndex !== undefined) {
                sectionOrder[idPrefix] = scope.sectionIndex;
            }

            var ngModelString = '';
            if (scope.modelString !== undefined) {
                ngModelString = scope.modelString;
            } else if (scope.sectionIndex !== undefined) {
                ngModelString = 'jsonCodeSections[' + scope.sectionIndex + ']';
            }

            tplEl = constructAngularElement(
                tplEl,
                scope.sectionObj,
                idPrefix,
                ngModelString
            );

            // tEle更新子DOM结构
            ele.replaceWith(tplEl);


            /**
             * 根据childObj构建DOM子树，插入到parent中作为孩子
             *
             * @param parent        父节点，插入元素于其中
             * @param childObj      $scope.jsonCodeSections[0/1/2..] 或其孩子
             * @param idPrefix      元素id的前缀
             * @param ngModelPrefix ng-model中的前缀
             * @returns {*}         父节点返回
             */
            function constructAngularElement(parent, childObj, idPrefix, ngModelPrefix) {
                for (var key in childObj) {
                    if (key === '$$hashKey' || !childObj.hasOwnProperty(key)) {
                        continue;
                    }

                    var idString = idPrefix + '-' + key;
                    var ngModelString = ngModelPrefix + (isNaN(key) ? '[\'' + key + '\']' : '[' + key + ']');
                    var isRequired = inRequiredItemByModel(ngModelString);

                    var row = null;
                    var label = null;
                    var contentRequired = '';
                    var disabledInput = (key === 'type' && /jsonCodeSections\[\d+\]$/g.test(ngModelPrefix)) ? 'disabled' : '';

                    if (isRequired) {
                        row = angular.element(
                            '<div class="module-row clearfix" ng-class="{\'has-error\':'
                            + ngModelString + '===undefined}"></div>'
                        );
                        row = $compile(row)(scope.$parent);

                        // 不能修改或者删除每个section的 type
                        label = angular.element(
                            '<label for="' + idString + '" class="module-item">'
                            + key + '<span class="required-item"></span>:</label>'
                        );

                        contentRequired = 'required';

                    } else  {
                        row = angular.element('<div class="module-row clearfix"></div>');

                        if ($.isArray(childObj)) {

                            // 数组，则无法修改键（即0， 1, 2...）
                            label = angular.element(
                                '<label for="' + idString + '" class="module-item">'
                                + key
                                + ':<span class="glyphicon glyphicon-remove module-remove" ng-click="deleteItemClick($event,\'' + idString + '\')" data-toggle="modal" href="#delete-item"></span>'
                                + '</label>');

                        } else {

                            label = angular.element(
                                '<label for="' + idString + '" class="module-item">'
                                + key
                                    // TODO edit按钮修改
                                + ':<span class="glyphicon glyphicon-edit module-edit" data-toggle="modal" ng-click="changeItemClick($event,\'' + idString + '\')"  href="#item-change"></span>'
                                + '<span class="glyphicon glyphicon-remove module-remove" ng-click="deleteItemClick($event,\'' + idString + '\')" data-toggle="modal" href="#delete-item"></span>'
                                + '</label>'
                            );
                        }
                    }
                    label = $compile(label)(scope.$parent);


                    var content = '';
                    if (typeof childObj[key] === 'string' || typeof childObj[key] === 'number') {

                        // 字符串 或者 数字类型
                        content = '<input id="' + idString + '" name="' + idString + '" class="form-control module-content"'
                            + ' ng-model="' + ngModelString + '" ' + contentRequired + ' ' + disabledInput + '>';
                        content = $compile(content)(scope.$parent);

                    } else if (typeof childObj[key] === 'boolean') {

                        // 布尔类型，生成radio元素
                        //content = '<div id="' + idString + '" name="' + idString + '" class="module-content" ' + contentRequired + '>'
                        //    + '<label class="radio-inline" for="' + idString + '1">'
                        //    + '<input type="radio" name="' + idString + '" id="' + idString + '1" ng-value="true" ng-model="' + ngModelString + '" /> true'
                        //    + '</label>'
                        //    + '<label class="radio-inline" for="' + idString + '0">'
                        //    + '<input type="radio" name="' + idString + '" id="' + idString + '0" ng-value="false" ng-model="' + ngModelString + '"/> false'
                        //    + '</label></div>';

                        content = '<div id= "' + idString + '" class="btn-group module-content">'
                            + '<button type="button" class="btn btn-default dropdown-toggle radio-btn" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">'
                            + '{{' + ngModelString + '}}' + '<span class="caret"></span></button>'
                            + '<ul class="dropdown-menu">'
                            + '<li><a href ng-click="chooseRadio(\''+idString+'\', true)">ture</a></li>'
                            + '<li><a href ng-click="chooseRadio(\''+idString+'\', false)">false</a></li>'
                            + '</ul></div>';

                        content = $compile(content)(scope.$parent);

                    } else {

                        content = angular.element(
                            '<div id="' + idString + '" class="module-content"></div>'
                        );

                        content = arguments.callee(content, childObj[key], idString, ngModelString);
                    }

                    row.append(label);
                    row.append(content);
                    parent.append(row);
                }

                // 增加规则，如果childObj有itemRecommends，则无法增加
                var addItemDisabled = false;
                if (typeof childObj[key] === 'object' && 'itemRecommands' in childObj[key]) {
                    addItemDisabled = true;
                }

                var addItemBtn = '<div class="module-row">'
                    + '<a href="#add-item" class="btn btn-primary btn-block btn-large'
                    + (addItemDisabled ? ' disabled' : '')
                    + '" ng-click="addItemClick($event,' + $.isArray(childObj) + ')" data-toggle="modal">'
                    + '<span class="glyphicon glyphicon-plus" aria-hidden="true">'
                    + '</span></a></div>';

                parent.append($compile(addItemBtn)(scope.$parent));

                return parent;
            }

        }
    };
});


app.directive('cootekJsonNav', function ($compile) {

    return {
        restrict: 'EA',
        replace: false,
        scope: {
            sectionObj: '='
        },
        link: function (scope, ele) {
            var maxDepth = 6;
            /**
             * 根据childObj构建导航条，插入到parent中作为孩子
             *
             * @param parent
             * @param childObj
             * @param idPrefix
             */
            (function constructAngularNav(parent, childObj, idPrefix, depth) {
                if (depth > maxDepth) {
                    return null;
                }
                var flag=0;
                for (var key in childObj) {
                    if (key === '$$hashKey' || !childObj.hasOwnProperty(key)) {
                        continue;
                    }

                    var idString = idPrefix + '-' + key;
                    var content = '';

                    if (typeof childObj[key] === 'object') {
                        //console.log(childObj[key]);
                        for(var subKey in childObj[key])
                        {
                            if(subKey==='title') {
                                flag=1;
                                break;
                            }
                            if(subKey==='name'){
                                flag=2;
                                break;
                            }
                        }
                        if(flag===1){
                        content = angular.element('<li><a href="#' + idString + '">' + key +'&nbsp;&nbsp;['+childObj[key]['title']+ ']</a></li>');
                             }
                        else if(flag===0)
                        content =angular.element('<li><a href="#' + idString + '">' + key + '</a></li>');
                        else
                        content=angular.element('<li><a href="#' + idString + '">' + key +'&nbsp;&nbsp;['+childObj[key]['name']+ ']</a></li>');
                        var list = constructAngularNav(
                            angular.element('<ul class="nav"></ul>'),
                            childObj[key], 
                            idString,
                            depth + 1
                        );
                        content.append(list);

                    } else {
                        content = angular.element('<li><a href="#' + idString + '">' + key + '</a></li>');
                    }

                    parent.append(content);
                }

                return parent;

            })(ele, scope.sectionObj, getIdPrefix(scope.sectionObj), 0);

        }
    };
});


