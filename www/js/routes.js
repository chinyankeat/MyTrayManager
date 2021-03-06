angular.module('app.routes', [])

.config(function($stateProvider, $urlRouterProvider) {

  // Ionic uses AngularUI Router which uses the concept of states
  // Learn more here: https://github.com/angular-ui/ui-router
  // Set up the various states which the app can be in.
  // Each state's controller can be found in controllers.js
  $stateProvider



  .state('tabsController', {
    url: '/page1',
    templateUrl: 'templates/tabsController.html',
    abstract:true
  })

  .state('tabsController.login', {
    url: '/page5',
    views: {
      'tab1': {
        templateUrl: 'templates/login.html',
        controller: 'loginCtrl'
      }
    }
  })

  .state('tabsController.signup', {
    url: '/page6',
    views: {
      'tab3': {
        templateUrl: 'templates/signup.html',
        controller: 'signupCtrl'
      }
    }
  })

  .state('manageOrder', {
      url: '/page7',
      templateUrl: 'templates/manageOrder.html',
      controller: 'manageOrderCtrl'
    })

  .state('processOrder', {
      url: '/page8',
      templateUrl: 'templates/processOrder.html',
      controller: 'processOrderCtrl'
    })

  .state('manageMenu', {
      url: '/page9',
      templateUrl: 'templates/manageMenu.html',
      controller: 'manageMenuCtrl'
    })

  .state('manageItem', {
    url: '/page10',
    templateUrl: 'templates/manageItem.html',
    controller: 'manageItemCtrl'
  })

  .state('editItem', {
    url: '/page11',
    templateUrl: 'templates/editItem.html',
    controller: 'editItemCtrl'
  })

  .state('addItem', {
    url: '/page12',
    templateUrl: 'templates/addItem.html',
    controller: 'addItemCtrl'
  })

  .state('settings', {
    url: '/page13',
    templateUrl: 'templates/settings.html',
    controller: 'settingsCtrl'
  })

  .state('support', {
    url: '/page14',
    templateUrl: 'templates/support.html',
    controller: 'supportCtrl'
  })

  .state('tabsController.forgotPassword', {
    url: '/page15',
    views: {
      'tab1': {
        templateUrl: 'templates/forgotPassword.html',
        controller: 'forgotPasswordCtrl'
      }
    }
  })

$urlRouterProvider.otherwise('/page1/page5')



});
