// var SERVICE_ADDR = "http://localhost:8080";
var SERVICE_ADDR = "";
var CREATE_ITEM_DIALOG_TEMPLATE = "<form class='form-horizontal'>" +
                  "<div class='form-group'>" +
                    "<div style='font-size:32px;margin-bottom:10px;padding-left:40px;'>创建配置项</div>" +
                  "</div>" +
                  "<div class='form-group'>" +
                    "<label class='col-sm-2 control-label'>项目名称</label>" +
                    "<div class='col-sm-10'>" +
                      "<input type='text' class='form-control' placeholder='最长85个英文字符' ng-model='new_item.name' />" +
                    "</div>" +
                  "</div>" +
                  "<div class='form-group'>" +
                    "<label class='col-sm-2 control-label'>可见性</label>" +
                    "<div class='col-sm-10'>" +
                      "<select class='form-control' ng-model='new_item.visibility'>" +
                        "<option value='public'>公开</option>" +
                        "<option value='private'>私有</option>" +
                      "</select>" +
                    "</div>" +
                  "</div>" +
                  "<div class='form-group'>" +
                    "<label class='col-sm-2 control-label'>配置项类型</label>" +
                    "<div class='col-sm-10'>" +
                      "<select class='form-control' ng-change='changeEditorMode()' ng-model='new_item.type'>" +
                        "<option ng-selected='new_item.type.toUpperCase() === type.name' ng-repeat='type in item_type_options' value='{{type.value}}' >{{type.name}}</option>" +
                      "</select>" +
                    "</div>" +
                  "</div>" +
                  "<div class='form-group'>" +
                    "<div class='col-sm-12'>" +
                      "<div ui-ace='{onLoad: aceLoaded, advanced: {fontSize: 14}}'></div>" +
                    "</div>" +
                  "</div>" +
                "</form>";

var ITEM_TYPE_OPTIONS = [
  {'name': 'PLAIN', 'value': 'PLAIN'},
  {'name': 'JSON', 'value': 'JSON'},
  {'name': 'XML', 'value': 'XML'},
  {'name': 'YAML', 'value': 'YAML'},
];

if (!!bootbox) {
  bootbox.setDefaults({
    size: "small",
    locale: "zh_CN",
    closeButton: false
  });
  bootbox.setMessage = function(dialog, message) {
    dialog.find(".bootbox-body").html(message);
  };
}

function _clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

var whoami = null;

function get_whoami() {
  return whoami;
}

function error_handle(q) {
  return function(err) {
    if (!!err.code) {
      q.reject(err);
    } else {
      q.reject({"code": -1, "msg": err.statusText || err});
    }
  }
}

angular.module('guldan.services', [])

.factory('$connection', ['$http', '$q', function($http, $q){
  return {
    me: function() {
      return get_whoami();
    },
    islogin: function () {
      var q = $q.defer();
      if (!!whoami) {
        q.resolve(get_whoami());
      } else {
        $http.get(SERVICE_ADDR + '/api/islogin').success(function(result) {
          whoami = result.data;
          return q.resolve(get_whoami());
        }).error(error_handle(q));
      }
      return q.promise;
    },
    reg: function (user) {
      var q = $q.defer();
      $http.post(SERVICE_ADDR + '/api/register', { name: user.name, password: user.password }).success(function(result) {
        q.resolve(true);
      }).error(error_handle(q));
      return q.promise;
    },
    login: function (user) {
      var q = $q.defer();
      $http.post(SERVICE_ADDR + '/api/login', {name: user.name, password: user.password}).success(function(result) {
        whoami = result.data;
        q.resolve(whoami);
      }).error(error_handle(q));
      return q.promise;
    },
    logout: function () {
      var q = $q.defer();
      $http.post(SERVICE_ADDR + '/api/logout').success(function (result) {
        whoami = null;
        q.resolve(true);
      }).error(error_handle(q));
      return q.promise;
    },
    modify_profile: function (uid, password) {
      var q = $q.defer();
      $http.post(SERVICE_ADDR + '/api/user/' + uid, { "new_password": password }).success(function (result) {
        q.resolve(true);
      }).error(error_handle(q));
      return q.promise;
    },
    search_users: function (search_key) {
      var q = $q.defer();
      $http.get(SERVICE_ADDR + '/api/users?q=' + search_key).success(function(result) {
        q.resolve(result.data);
      }).error(error_handle(q));
      return q.promise;
    },
    list_organization: function() {
      var q = $q.defer();
      $http.get(SERVICE_ADDR + '/api/org').success(function (result) {
        q.resolve(result.data);
      }).error(error_handle(q));
      return q.promise;
    },
    create_organization: function(name, is_private) {
      var q = $q.defer();
      $http.put(SERVICE_ADDR + '/api/org', {"name": name, "private": is_private}).success(function(result) {
        q.resolve(result.data);
      }).error(error_handle(q));
      return q.promise;
    },
    delete_organization: function(oid) {
      var q = $q.defer();
      $http.delete(SERVICE_ADDR + '/api/org/' + oid).success(function(result) {
        q.resolve(true);
      }).error(error_handle(q));
      return q.promise;
    },
    update_organization: function(oid, data) {
      var q = $q.defer();
      $http.post(SERVICE_ADDR + '/api/org/' + oid, data).success(function(result) {
        q.resolve(true);
      }).error(error_handle(q));
      return q.promise;
    },
    get_organization: function(id) {
      var q = $q.defer();
      $http.get(SERVICE_ADDR + '/api/org/' + id).success(function(result) {
        if (!result.data.projects) {
          result.data.projects = [];
        }
        q.resolve(result.data);
      }).error(error_handle(q));
      return q.promise;
    },
    authorize_organization: function(oid, uid, type) {
      var q = $q.defer();
      $http.post(SERVICE_ADDR + '/api/org/' + oid + '/authorize',
          {"user_id": uid, "type": type}).success(function(result) {
        q.resolve(true);
      }).error(error_handle(q));
      return q.promise;
    },
    cancel_organization: function(oid, uid) {
      var q = $q.defer();
      $http.delete(SERVICE_ADDR + '/api/org/' + oid + '/authorize/' + uid).success(function(result) {
        q.resolve(true);
      }).error(error_handle(q));
      return q.promise;
    },
    create_project: function(oid, name, is_private) {
      var q = $q.defer();
      $http.put(SERVICE_ADDR + '/api/project', {"parent_id": oid, "name": name, "private": is_private}).success(function(result) {
        q.resolve(result.data);
      }).error(error_handle(q));
      return q.promise;
    },
    delete_project: function(prid) {
      var q = $q.defer();
      $http.delete(SERVICE_ADDR + '/api/project/' + prid).success(function(result) {
        q.resolve(true);
      }).error(error_handle(q));
      return q.promise;
    },
    update_project: function(prid, data) {
      var q = $q.defer();
      $http.post(SERVICE_ADDR + '/api/project/' + prid, data).success(function(result) {
        q.resolve(true);
      }).error(error_handle(q));
      return q.promise;
    },
    get_project: function(id) {
      var q = $q.defer();
      $http.get(SERVICE_ADDR + '/api/project/' + id).success(function(result) {
        q.resolve(result.data);
      }).error(error_handle(q));
      return q.promise;
    },
    authorize_project: function(prid, uid, type) {
      var q = $q.defer();
      $http.post(SERVICE_ADDR + '/api/project/' + prid + '/authorize',
          {"user_id": uid, "type": type}).success(function(result) {
        q.resolve(true);
      }).error(error_handle(q));
      return q.promise;
    },
    cancel_project: function(prid, uid) {
      var q = $q.defer();
      $http.delete(SERVICE_ADDR + '/api/project/' + prid + '/authorize/' + uid).success(function(result) {
        q.resolve(true);
      }).error(error_handle(q));
      return q.promise;
    },
    create_item: function(prid, name, content, type, is_private, gray) {
      gray = !!gray || false;
      var q = $q.defer();
      $http.put(SERVICE_ADDR + '/api/item?grey=' + gray,
        {"parent_id": prid, "name": name, "content": content, "type": type, "private": is_private}).success(function(result) {
        q.resolve(result.data);
      }).error(error_handle(q));
      return q.promise;
    },
    delete_item: function(iid, gray) {
      gray = !!gray || false;
      var q = $q.defer();
      $http.delete(SERVICE_ADDR + '/api/item/' + iid + '?grey=' + gray).success(function(result) {
        q.resolve(true);
      }).error(error_handle(q));
      return q.promise;
    },
    publish_item: function(iid, data, gray) {
      gray = !!gray || false;
      var q = $q.defer();
      $http.post(SERVICE_ADDR + '/api/item/' + iid + '?grey=' + gray, data).success(function(result) {
        q.resolve(true);
      }).error(error_handle(q));
      return q.promise;
    },
    get_item: function(id, gray) {
      gray = !!gray || false;
      var q = $q.defer();
      $http.get(SERVICE_ADDR + '/api/item/' + id + '?grey=' + gray).success(function(result) {
        q.resolve(result.data);
      }).error(error_handle(q));
      return q.promise;
    },
    authorize_item: function(iid, uid, type) {
      var q = $q.defer();
      $http.post(SERVICE_ADDR + '/api/item/' + iid + '/authorize',
          {"user_id": uid, "type": type}).success(function(result) {
        q.resolve(true);
      }).error(error_handle(q));
      return q.promise;
    },
    cancel_item: function(iid, uid) {
      var q = $q.defer();
      $http.delete(SERVICE_ADDR + '/api/item/' + iid + '/authorize/' + uid).success(function(result) {
        q.resolve(true);
      }).error(error_handle(q));
      return q.promise;
    },
    get_item_stats: function(iid) {
      var q = $q.defer();
      $http.get(SERVICE_ADDR + '/api/item/' + iid + '/stats').success(function(result) {
        q.resolve(result.data);
      }).error(error_handle(q));
      return q.promise;
    },
    get_item_versions: function(iid, offset) {
      var q = $q.defer();
      $http.get(SERVICE_ADDR + '/api/item/' + iid + '/versions?limit=10&order=desc&offset=' + offset).success(function(result) {
        let data = result.data;
        var page = {
          has_prev: offset != 0,
        has_next: offset + data.versions.length != data.total,
        offset: offset,
        versions: data.versions,
        };
        q.resolve(page);
      }).error(error_handle(q));
      return q.promise;
    },
    rollback: function(iid, version) {
      var q = $q.defer();
      $http.post(SERVICE_ADDR + '/api/item/' + iid + '/versions/rollback?version_id=' + version).success(function(result) {
        q.resolve(result.data);
      }).error(error_handle(q));
      return q.promise;
    },
    search_resources: function(key) {
      var q = $q.defer();
      $http.get(SERVICE_ADDR + '/api/resource/search?q=' + key).success(function (result) {
        q.resolve(result.data);
      }).error(error_handle(q));
      return q.promise;
    },
    search_audits: function(key, offset) {
      var q = $q.defer();
      $http.get(SERVICE_ADDR + '/api/audit/search?limit=10&offset=' +
          offset + '&q=' + key).success(function (result) {
        let data = result.data;
        var page = {
          search_key: key,
          has_prev: offset != 0,
          has_next: offset + data.audits.length != data.total,
          offset: offset,
          audits: data.audits,
        };
        q.resolve(page);
      }).error(error_handle(q));
      return q.promise;
    },
    get_api_document: function() {
      console.log("get api document");
      var q = $q.defer();
      $http.get(SERVICE_ADDR + '/API.md').success(function (result) {
        q.resolve(result);
      }).error(error_handle(q));
      return q.promise;
    },
  };
}])

.factory('$shared', [function(){
  var shared = {}
  return {
    get: function(key) {
      return shared[key];
    },
    set: function(key, value) {
      shared[key] = value;
    },
    remove: function(key) {
      shared[key] = undefined;
    }
  }
}])

.factory('$parent', [function(){
  let parents = [];
  return {
    push: function (path) {
      parents.push(path);
    },
    pop: function () {
      return parents.pop();
    }
  };
}])

.factory('$utils', ['$state', function($state) {
  return {
    error: function(message, callback) {
      bootbox.alert(message, callback);
    },
    success: function(message, callback, large) {
      if (!!large) {
        bootbox.alert({message: message, callback: callback, size: 'large'});
      } else {
        bootbox.alert(message, callback);
      }
    },
    loading: function(message, callback) {
      bootbox.dialog({ message: message });
    },
    confirm: function(message, callback, large) {
      if (!!large) {
        bootbox.confirm({message: message, callback: callback, size: 'large'});
      } else {
        bootbox.confirm({message: message, callback: callback});
      }
    },
    prompt: function(message, callback) {
      bootbox.prompt(message, callback);
    },
    dialog: function(message, large) {
      if (!!large) {
        bootbox.dialog({message: message, closeButton: true, size: 'large'});
      } else {
        bootbox.dialog({message: message, closeButton: true});
      }
    },
    clone: function(o) {
      return _clone(o);
    },
    copy_from_ace_editor_to_clipboard: function(ace_editor, html_selector) {
      var copyTextarea = document.querySelector(html_selector);
      copyTextarea.style.display = 'block';
      copyTextarea.value = ace_editor.getValue();
      copyTextarea.select();
      var msg = '配置项拷贝失败，请重试';
      try {
          var success = document.execCommand('copy');
          msg = success ? '配置项成功拷贝' : msg;
      } catch (err) {
          msg += ': ' + err.toString();
      } finally {
        copyTextarea.value = "";
        copyTextarea.style.display = 'none';
      }
      bootbox.dialog({message: msg, closeButton: true});
    },
    is_valid_resource_name: function (name) {
        return /[-a-z0-9_]+/.test(name);
    },
    itemErrorHandler: function (err) {
      bootbox.alert(err.msg, function() {
        if (err.code === -2) {
          $state.go('dashboard.index');
        } else {
          $state.go('dashboard.config.index');
        }
      });
    }
  };
}])

.factory('$guldan_editor', function () {
  return {
    CreateItemDisplayEditor: function (scope, connection, itemId, itemErrorHandler) {
      return new ItemDisplayEditor(scope, connection, itemId, itemErrorHandler);
    },
    CreateItemCreateForProjectEditor: function (scope, connection, project) {
      return new ItemCreateForProjectEditor(scope, connection, project);
    },
    CreateItemCreateBasedOnExistingItemEditor: function (scope, connection, currentItem) {
      return new ItemCreateBasedOnExistingItemEditor(scope, connection, currentItem);
    }
  }
})

.factory('$item_helper', ['$utils', '$connection', '$state', '$stateParams', '$guldan_editor', function ($utils, $connection, $state, $stateParams, $guldan_editor) {
  return {
    create_item_for_project: function (scope, compile) {
      var editor = $guldan_editor.CreateItemCreateForProjectEditor(scope, $connection, scope.project);
      scope.aceLoaded = function (ace_editor) {
        editor.guldanEditorLoaded(ace_editor);
      };
      scope.changeEditorMode = function (itemtype) {
        editor.changeEditorMode(itemtype);
      };
      $utils.confirm("<div id='create-item'></div>", function (ok) {
        if (ok) {
          console.log(scope.new_item);
          if (!$utils.is_valid_resource_name(scope.new_item.name)) {
            $utils.error("名字不合法");
            return;
          }
          scope.new_item.prid = $stateParams.prid;
          editor.createNewItem(scope.new_item, function (item) {
                scope.project.items.push({"id": item.id, "name": item.name});
              },
              default_error_handle($state, $utils)
          );
        }
      }, true);
      scope.item_type_options = ITEM_TYPE_OPTIONS;
      var compileFn = compile(CREATE_ITEM_DIALOG_TEMPLATE);
      var $dom = compileFn(scope);
      var $sut = angular.element(document.getElementById('create-item'));
      $sut.append($dom);
    },
    create_item_based_on_current: function (scope, compile) {
      var editor = $guldan_editor.CreateItemCreateBasedOnExistingItemEditor(scope, $connection, scope.item);
      scope.aceLoaded = function (ace_editor) {
        editor.guldanEditorLoaded(ace_editor);
      };
      scope.changeEditorMode = function (itemtype) {
        editor.changeEditorMode(itemtype);
      };
      $utils.confirm("<div id='create-item'></div>", function (ok) {
        if (ok) {
          console.log(scope.new_item);
          if (!$utils.is_valid_resource_name(scope.new_item.name)) {
            $utils.error("名字不合法");
            return;
          }
          scope.new_item.prid = scope.item.parent_id;
          editor.createNewItem(scope.new_item, function (item) {
                $utils.dialog("配置项" + item.name + "成功创建");
              },
              default_error_handle($state, $utils)
          );
        }
      }, true);
      scope.item_type_options = ITEM_TYPE_OPTIONS;
      var compileFn = compile(CREATE_ITEM_DIALOG_TEMPLATE);
      var $dom = compileFn(scope);
      var $sut = angular.element(document.getElementById('create-item'));
      $sut.append($dom);
    },
    item_display: function (scope) {
      var editor = $guldan_editor.CreateItemDisplayEditor(scope, $connection, $stateParams.iid, $utils.itemErrorHandler);
      scope.aceLoaded = function (ace_editor) {
        editor.guldanEditorLoaded(ace_editor);
      };
      scope.changeEditorMode = function (itemtype) {
        editor.changeEditorMode(itemtype);
      };

      return editor;
    }
  };
}]);

