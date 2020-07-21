var app = angular.module("app", ["ngSanitize", "ngCsv"]);

app.controller("addUserController", function($scope, $http) {
  $scope.regRegEx = "^\\d{2}([A-Z]|[a-z]){3}\\d{4}$";
  $scope.check = function() {
    if (
      $scope.addUserForm.$invalid ||
      $scope.password_model != $scope.confirm_model
    ) {
      return;
    }
    route = "/checkemail?email=" + $scope.email_model;
    $http.get(route).success(function(res) {
      if (res.existing) {
        $scope.checkEmail = true;
        alert("An User With Same Email Id Already Exists");
      } else {
        if ($scope.registerType_model == "internal") {
          var route = "/checkregnum?regNum=" + $scope.institute_model;
          $http.get(route).success(function(res) {
            if (res.existing) {
              $scope.checkregNum = true;
              alert("An User With Same College Roll Number Already Exists");
            } else {
              lodocument.getElementById("register-form").submit();
            }
          });
        } else {
          document.getElementById("register-form").submit();
        }
      }
    });
  };
});

app.controller("listController", function($scope, $http) {
  $scope.initEvents = function() {
    $scope.students = [
      { APPLNO: "123123123", PROGRAMME: "B. Tech", NAME: "Ankur" }
    ];
    $http.get("/events/list").success(function(data) {
      // $scope.students = [{"APPLNO":"123123123", "PROGRAMME":"B. Tech", "NAME":"Ankur"}]
    });
  };

  $scope.query = function() {};

  $scope.pdf = function() {};

  $scope.confirm = function(m, cb) {
    vex.dialog.confirm({
      message: "Are you sure you want to " + m,
      callback: function(value) {
        console.log("working!" + value);
        if (value) {
          cb();
          $scope.$apply();
        }
      },
      buttons: [
        $.extend({}, vex.dialog.buttons.YES, {
          text: "Yes"
        }),
        $.extend({}, vex.dialog.buttons.NO, {
          text: "No"
        })
      ]
    });
  };
});
