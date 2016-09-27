angular.module('app.controllers', [])


.controller('loginCtrl', function ($scope, $rootScope, $ionicHistory, sharedUtils, $state, fireBaseData, $ionicSideMenuDelegate) {
    $rootScope.extras = false; // For hiding the side bar and nav icon

    // When the user logs out and reaches login page,
    // we clear all the history and cache to prevent back link
    $scope.$on('$ionicView.enter', function (ev) {
        if (ev.targetScope !== $scope) {
            $ionicHistory.clearHistory();
            $ionicHistory.clearCache();
        }
    });


    //Check if user already logged in
    firebase.auth().onAuthStateChanged(function (user) {
        if (user) {

            $ionicHistory.nextViewOptions({
                historyRoot: true
            });
            $ionicSideMenuDelegate.canDragContent(true); // Sets up the sideMenu dragable
            $rootScope.extras = true;
            sharedUtils.hideLoading();
            $state.go('manageOrder', {}, {
                location: "replace"
            });

        }
    });


    $scope.loginEmail = function (formName, cred) {

        if (formName.$valid) { // Check if the form data is valid or not

            sharedUtils.showLoading();

            //Email
            firebase.auth().signInWithEmailAndPassword(cred.email, cred.password).then(function (result) {

                    // You dont need to save the users session as firebase handles it
                    // You only need to :
                    // 1. clear the login page history from the history stack so that you cant come back
                    // 2. Set rootScope.extra;
                    // 3. Turn off the loading
                    // 4. Got to menu page

                    $ionicHistory.nextViewOptions({
                        historyRoot: true
                    });
                    $rootScope.extras = true;
                    sharedUtils.hideLoading();
                    $state.go('manageMenu', {}, {
                        location: "replace"
                    });

                }
                , function (error) {
                    sharedUtils.hideLoading();
                    sharedUtils.showAlert("Please note", "Authentication Error");
                }
            );

        } else {
            sharedUtils.showAlert("Please note", "Entered data is not valid");
        }
    };


    $scope.loginFb = function () {
        //Facebook Login
        firebase.auth().signInWithPopup(fireBaseData.refFbProvider()).then(function (result) {
            // This gives you a Facebook Access Token. You can use it to access the Facebook API.
            var token = result.credential.accessToken;
            // The signed-in user info.
            var user = result.user;

            $ionicHistory.nextViewOptions({
                historyRoot: true
            });
            $rootScope.extras = true;
            $state.go('manageOrder', {}, {
                location: "replace"
            });        
        
        }).catch(function (error) {
            // Handle Errors here.
            var errorCode = error.code;
            var errorMessage = error.message;
            // The email of the user's account used.
            var email = error.email;
            // The firebase.auth.AuthCredential type that was used.
            var credential = error.credential;
            sharedUtils.showAlert("Sorry", "Unable to sign in with Facebook due to " + user.message);
        })
    };

    $scope.loginGmail = function () {
        //Gmail Login
    };
})

.controller('signupCtrl', function ($scope, $rootScope, sharedUtils, $ionicSideMenuDelegate
    , $state, fireBaseData, $ionicHistory) {
    $rootScope.extras = false; // For hiding the side bar and nav icon

    $scope.signupEmail = function (formName, cred) {

        if (formName.$valid) { // Check if the form data is valid or not

            sharedUtils.showLoading();

            //Main Firebase Authentication part
            firebase.auth().createUserWithEmailAndPassword(cred.email, cred.password).then(function (result) {

                //Add name and default dp to the Autherisation table
                result.updateProfile({
                    displayName: cred.name
                    , photoURL: "default_dp"
                }).then(function () {}, function (error) {});

                //Add phone number to the user table
                fireBaseData.refUser().child(result.uid).set({
                    telephone: cred.phone
                });

                //Registered OK
                $ionicHistory.nextViewOptions({
                    historyRoot: true
                });
                $ionicSideMenuDelegate.canDragContent(true); // Sets up the sideMenu dragable
                $rootScope.extras = true;
                sharedUtils.hideLoading();
                $state.go('manageOrder', {}, {
                    location: "replace"
                });

            }, function (error) {
                sharedUtils.hideLoading();
                sharedUtils.showAlert("Please note", "Sign up Error");
            });

        } else {
            sharedUtils.showAlert("Please note", "Entered data is not valid");
        }
    }

    $scope.signupFacebook = function () {
        firebase.auth().signInWithPopup(fireBaseData.refFbProvider()).then(function (result) {
            // This gives you a Facebook Access Token. You can use it to access the Facebook API.
            var token = result.credential.accessToken;
            // The signed-in user info.
            var user = result.user;

            $ionicHistory.nextViewOptions({
                historyRoot: true
            });
            $rootScope.extras = true;
            $state.go('manageOrder', {}, {
                location: "replace"
            });        
        
        }).catch(function (error) {
            // Handle Errors here.
            var errorCode = error.code;
            var errorMessage = error.message;
            // The email of the user's account used.
            var email = error.email;
            // The firebase.auth.AuthCredential type that was used.
            var credential = error.credential;
            sharedUtils.showAlert("Sorry", "Unable to sign in with Facebook due to " + user.message);
        })
    }
})

// Display List of Orders from Customers
.controller('manageOrderCtrl', function ($scope, $rootScope, $ionicSideMenuDelegate, fireBaseData, $state
    , $ionicHistory, $firebaseArray, sharedUtils) {

    //Check if user already logged in
    firebase.auth().onAuthStateChanged(function (user) {
        if (user) {
            $scope.user_info = user; //Saves data to user_info
            
            // Retrieve Store Open Status
            fireBaseData.refStoreControl().once("value", function (snapshot) {
                $scope.storeOpenStatus = snapshot.val().storeOpenStatus;
            });
            
        } else {

            $ionicSideMenuDelegate.toggleLeft(); //To close the side bar
            $ionicSideMenuDelegate.canDragContent(false); // To remove the sidemenu white space

            $ionicHistory.nextViewOptions({
                historyRoot: true
            });
            $rootScope.extras = false;
            sharedUtils.hideLoading();
            $state.go('tabsController.login', {}, {
                location: "replace"
            });

        }
    });

    // On Loggin in to menu page, the sideMenu drag state is set to true
    $ionicSideMenuDelegate.canDragContent(true);
    $rootScope.extras = true;

    // When user visits A-> B -> C -> A and clicks back, he will close the app instead of back linking
    $scope.$on('$ionicView.enter', function (ev) {
        if (ev.targetScope !== $scope) {
            $ionicHistory.clearHistory();
            $ionicHistory.clearCache();            
        }

        // Load the store open/close status whenver we get the view
        $scope.loadStoreStatus();

        // add a listener whenever cart is changed
        if($scope.customerOrderList == null) {
            
            $scope.OrdersListener = new fireBaseData.refOrders();        
            $scope.OrdersListener.on('value', function(snapshot) { 

                $scope.Orders = $firebaseArray(fireBaseData.refOrders());
                
            });
        }
    });

    $scope.loadStoreStatus = function (){
        // Retrieve Store Open Status
        fireBaseData.refStoreControl().once("value", function (snapshot) {
            $scope.storeOpenStatus = snapshot.val().storeOpenStatus;
            
            if($scope.storeOpenStatus) {
                $scope.storeStatusText = 'Open';
            } else {
                $scope.storeStatusText = 'Closed';
            }
        });
    }
    
    $scope.goToOrder = function (orderIndex){
        $rootScope.orderDetail = $scope.Orders[orderIndex];

        $state.go('processOrder', {}, {
            location: "replace"
        });
    }
    
    $scope.goToSettings = function (){
        $state.go('settings', {}, {
            location: "replace"
        });
    }
})

// Display Order Control
.controller('processOrderCtrl', function ($scope, $rootScope, $ionicSideMenuDelegate, fireBaseData, $state
    , $ionicHistory, $firebaseArray, sharedUtils) {

    //Check if user already logged in
    firebase.auth().onAuthStateChanged(function (user) {
        if (user) {
            $scope.user_info = user; //Saves data to user_info
            $scope.orderDetail = $rootScope.orderDetail;
            
        } else {

            $ionicSideMenuDelegate.toggleLeft(); //To close the side bar
            $ionicSideMenuDelegate.canDragContent(false); // To remove the sidemenu white space

            $ionicHistory.nextViewOptions({
                historyRoot: true
            });
            $rootScope.extras = false;
            sharedUtils.hideLoading();
            $state.go('tabsController.login', {}, {
                location: "replace"
            });

        }
    });

    // On Loggin in to menu page, the sideMenu drag state is set to true
    $ionicSideMenuDelegate.canDragContent(true);
    $rootScope.extras = true;

    // When user visits A-> B -> C -> A and clicks back, he will close the app instead of back linking
    $scope.$on('$ionicView.enter', function (ev) {
        if (ev.targetScope !== $scope) {
            $ionicHistory.clearHistory();
            $ionicHistory.clearCache();            
        }

    });

    $scope.initManageOrder = function(){
        $scope.Orders = $firebaseArray(fireBaseData.refOrders());
    }

    $scope.feedbackOrder = function (){
    }
    $scope.orderPending = function (){
        fireBaseData.refOrders().child($scope.orderDetail.$id).update({orderStatus: "pending"});
    } 
    $scope.orderProcessing = function (){
        fireBaseData.refOrders().child($scope.orderDetail.$id).update({orderStatus: "processing"});
    }
    $scope.orderReady = function (){
        fireBaseData.refOrders().child($scope.orderDetail.$id).update({orderStatus: "ready"});
    }    
})

    
// Display and control the main category page
.controller('manageMenuCtrl', function ($scope, $rootScope, $ionicSideMenuDelegate, fireBaseData, $state
    , $ionicHistory, $firebaseArray, sharedUtils) {

    //Check if user already logged in
    firebase.auth().onAuthStateChanged(function (user) {
        if (user) {
            $scope.user_info = user; //Saves data to user_info
        } else {

            $ionicSideMenuDelegate.toggleLeft(); //To close the side bar
            $ionicSideMenuDelegate.canDragContent(false); // To remove the sidemenu white space

            $ionicHistory.nextViewOptions({
                historyRoot: true
            });
            $rootScope.extras = false;
            sharedUtils.hideLoading();
            $state.go('tabsController.login', {}, {
                location: "replace"
            });
        }
    });

    // On Loggin in to menu page, the sideMenu drag state is set to true
    $ionicSideMenuDelegate.canDragContent(true);
    $rootScope.extras = true;

    // When user visits A-> B -> C -> A and clicks back, he will close the app instead of back linking
    $scope.$on('$ionicView.enter', function (ev) {
        if (ev.targetScope !== $scope) {
            $ionicHistory.clearHistory();
            $ionicHistory.clearCache();
        }
    });

    $scope.loadCategoryAndMenu = function () {
        sharedUtils.showLoading();
        $scope.menu = $firebaseArray(fireBaseData.refMenu());
        $scope.category = $firebaseArray(fireBaseData.refCategory());
        sharedUtils.hideLoading();
    }

    $scope.showCategoryItem = function (category_id) {
        $rootScope.current_category = category_id; //Save current category id

        // load the name of current category
        fireBaseData.refCategory().child(category_id).once("value", function(snapshot){
            $rootScope.category_name = snapshot.val().name;
        });
        
        $state.go('manageItem', {}, {
            location: "replace"
        });
    };
})



// Display and control items in menu category
.controller('manageItemCtrl', function ($scope, $rootScope, $ionicSideMenuDelegate, fireBaseData, $state
    , $ionicHistory, $firebaseArray, sharedUtils) {

    //Check if user already logged in
    firebase.auth().onAuthStateChanged(function (user) {
        if (user) {
            $scope.user_info = user; //Saves data to user_info
            
                sharedUtils.showLoading();
                
                $scope.menu = $firebaseArray(fireBaseData.refMenu());
                $scope.category = $firebaseArray(fireBaseData.refCategory());
            
                $scope.current_category = $rootScope.current_category;
                if ($scope.current_category == null){
                    $scope.current_category = 'cat1';   // next time don't hardcode
                }
                $scope.category_name = $rootScope.category_name;
                if ($scope.category_name == null){
                    $scope.category_name =  'Breakfast'; // next time don't hardcode
                }

                sharedUtils.hideLoading();            

        } else {

            $ionicSideMenuDelegate.toggleLeft(); //To close the side bar
            $ionicSideMenuDelegate.canDragContent(false); // To remove the sidemenu white space

            $ionicHistory.nextViewOptions({
                historyRoot: true
            });
            $rootScope.extras = false;
            sharedUtils.hideLoading();
            $state.go('tabsController.login', {}, {
                location: "replace"
            });
        }
    });

    // On Loggin in to menu page, the sideMenu drag state is set to true
    $ionicSideMenuDelegate.canDragContent(true);
    $rootScope.extras = true;

    // When user visits A-> B -> C -> A and clicks back, he will close the app instead of back linking
    $scope.$on('$ionicView.enter', function (ev) {
        if (ev.targetScope !== $scope) {
            $ionicHistory.clearHistory();
            $ionicHistory.clearCache();
        }
    });

    $scope.editItem = function (item) {
        
        $rootScope.currentItemId = item.$id; //Save current item id
        $rootScope.currentItemName = item.name;

        $state.go('editItem', {}, {
            location: "replace"
        });
    };
    
    $scope.addNewItem = function () {
        $state.go('addItem', {}, {
            location: "replace"
        });
    };
})
    
//Edit the individual item
.controller('editItemCtrl', function ($scope, $rootScope, $ionicSideMenuDelegate, fireBaseData, $state, $window
    , $ionicHistory, $firebaseArray, sharedUtils) {

    //Check if user already logged in
    firebase.auth().onAuthStateChanged(function (user) {
        if (user) {
            $scope.user_info = user; //Saves data to user_info

            $scope.currentItemName = $rootScope.currentItemName;
            $scope.item_info = {};
            // load the item information
            fireBaseData.refMenu().child($rootScope.currentItemId).once("value", function (snapshot) {
                $scope.currentItem = snapshot.val();

                // set the Availability text
                if ($scope.currentItem.available) {
                    $scope.itemAvailabilityText = 'Item is Available';
                    $scope.itemAvailabilityButton = 'Change to Unavailable';
                } else {
                    $scope.itemAvailabilityText = 'Item is Unavailable';
                    $scope.itemAvailabilityButton = 'Change to Available';
                }
                
                // set the subcategory Status
                if ($scope.currentItem.subcategory) {
                    $scope.itemSubcategoryText = 'Item is a Subcategory';
                    $scope.itemSubcategoryButton = 'Change to Non-Subcategory';
                } else {
                    $scope.itemSubcategoryText = 'Item is NOT a Subcategory';
                    $scope.itemSubcategoryButton = 'Change to a Subcategory';                    
                }
            });
            
        } else {

            $ionicSideMenuDelegate.toggleLeft(); //To close the side bar
            $ionicSideMenuDelegate.canDragContent(false); // To remove the sidemenu white space

            $ionicHistory.nextViewOptions({
                historyRoot: true
            });
            $rootScope.extras = false;
            sharedUtils.hideLoading();
            $state.go('tabsController.login', {}, {
                location: "replace"
            });
        }
    });

    // On Loggin in to menu page, the sideMenu drag state is set to true
    $ionicSideMenuDelegate.canDragContent(true);
    $rootScope.extras = true;

    // When user visits A-> B -> C -> A and clicks back, he will close the app instead of back linking
    $scope.$on('$ionicView.enter', function (ev) {
        if (ev.targetScope !== $scope) {
            $ionicHistory.clearHistory();
            $ionicHistory.clearCache();
        }
    });
    
    $scope.toggleAvailability = function () {
        if ($scope.currentItem.available) {
            fireBaseData.refMenu().child($rootScope.currentItemId).update({"available": false});
            $scope.currentItem.available = false;
            $scope.itemAvailabilityText = 'Item is Unavailable';
            $scope.itemAvailabilityButton = 'Change to Available';
        } else {
            fireBaseData.refMenu().child($rootScope.currentItemId).update({"available": true});
            $scope.currentItem.available = true;
            $scope.itemAvailabilityText = 'Item is Available';
            $scope.itemAvailabilityButton = 'Change to Unavailable';
        }
    }    
    
    $scope.toggleSubcategory = function () {
        if ($scope.currentItem.subcategory) {
            fireBaseData.refMenu().child($rootScope.currentItemId).update({"subcategory": false});
            $scope.currentItem.subcategory = false;
            $scope.itemSubcategoryText = 'Item is NOT a Subcategory';
            $scope.itemSubcategoryButton = 'Change to Subcategory';

        } else {
            fireBaseData.refMenu().child($rootScope.currentItemId).update({"subcategory": true});
            $scope.currentItem.subcategory = true;
            $scope.itemSubcategoryText = 'Item is Subcategry';
            $scope.itemSubcategoryButton = 'Change to a Non-Subcategory';
        }
    }

    $scope.save = function (item_info) {

        if (item_info.nameOfItem != "" && item_info.nameOfItem != null) {
            //Update  item Name
            fireBaseData.refMenu().child($rootScope.currentItemId).update({ // set
                name: item_info.nameOfItem
            });
            $scope.currentItem.name = item_info.nameOfItem;
        }

        if (item_info.description != "" && item_info.description != null) {
            //Update  item Description
            fireBaseData.refMenu().child($rootScope.currentItemId).update({ // set
                description: item_info.description
            });
            $scope.currentItem.description = item_info.description;
        }
        
        if (item_info.price != "" && item_info.price != null) {
            //Update  price
            fireBaseData.refMenu().child($rootScope.currentItemId).update({ // set
                price: item_info.price * 100
            });
            $scope.currentItem.price = item_info.price * 100;
        }
        $state.go($state.current, {}, {reload: true});
    }

    $scope.cancel = function () {
        $ionicHistory.backView().go();;
    }
    
    $scope.deleteItem = function () {
        fireBaseData.refMenu().child($rootScope.currentItemId).remove();
    }

    
    $scope.deleteItem = function () {
        var confirmPopup = $ionicPopup.confirm({
            title: 'Delete Item'
            , template: 'Are you sure you want to delete this item?'
            , buttons: [
                {
                    text: 'No'
                    , type: 'button-stable'
                }
                , {
                    text: 'Yes'
                    , type: 'button-assertive'
                    }
            ]
        });

        confirmPopup.then(function () {
            fireBaseData.refMenu().child($rootScope.currentItemId).remove();
        });
    };    
})
    

//Edit the individual item
.controller('addItemCtrl', function ($scope, $rootScope, $ionicSideMenuDelegate, fireBaseData, $firebaseArray, $state, $window
    , $ionicHistory, sharedUtils) {

    //Check if user already logged in
    firebase.auth().onAuthStateChanged(function (user) {
        if (user) {
            $scope.user_info = user;    //Saves data to user_info
            $scope.item_info = {};      // for Save Form

            $scope.categories = $firebaseArray(fireBaseData.refCategory());
            // Check what is the highest id not used. 
            $scope.allMenuItem = $firebaseArray(fireBaseData.refMenu());
            $scope.highestMenuId = 0;
            $scope.allMenuItem.$loaded().then(function(snapshot){ // wait until data is fully loaded
                
                for (var i=0; i<$scope.allMenuItem.length; i++) {
                    if($scope.allMenuItem[i].$id > $scope.highestMenuId) {
                        $scope.highestMenuId = parseInt($scope.allMenuItem[i].$id);
                    }
                }

                //sharedUtils.showAlert("test3", snapshot.length + " :: "+ $scope.highestMenuId + " :: " + $scope.allMenuItem.length);
                
            });

        } else {

            $ionicSideMenuDelegate.toggleLeft(); //To close the side bar
            $ionicSideMenuDelegate.canDragContent(false); // To remove the sidemenu white space

            $ionicHistory.nextViewOptions({
                historyRoot: true
            });
            $rootScope.extras = false;
            sharedUtils.hideLoading();
            $state.go('tabsController.login', {}, {
                location: "replace"
            });
        }
    });

    // On Loggin in to menu page, the sideMenu drag state is set to true
    $ionicSideMenuDelegate.canDragContent(true);
    $rootScope.extras = true;

    // When user visits A-> B -> C -> A and clicks back, he will close the app instead of back linking
    $scope.$on('$ionicView.enter', function (ev) {
        if (ev.targetScope !== $scope) {
            $ionicHistory.clearHistory();
            $ionicHistory.clearCache();
        }
    });

    $scope.save = function (item_info) {
        
        
        if (item_info.nameOfItem == "" || item_info.nameOfItem == null) {
            sharedUtils.showAlert("Error", "Name is required");
            return;
        }
        if (item_info.price == "" || item_info.price == null) {
            sharedUtils.showAlert("Error", "Price is required");
            return;
        }
    
        fireBaseData.refMenu().child($scope.highestMenuId+1).set({
            available: true
            , category: item_info.category
            , description: item_info.description
            , name: item_info.nameOfItem
            , price: item_info.price * 100
            , subcategory: false
        });
        $scope.highestMenuId = $scope.highestMenuId + 1;
        
        $state.go($state.current, {}, {reload: true});
    }

    $scope.cancel = function () {
        $ionicHistory.backView().go();;
    }
    
})

.controller('indexCtrl', function ($scope, $rootScope, sharedUtils, $ionicHistory, $state, $ionicSideMenuDelegate, sharedCartService) {

    //Check if user already logged in
    firebase.auth().onAuthStateChanged(function (user) {
        if (user) {
            $scope.user_info = user; //Saves data to user_info

            //Only when the user is logged in, the cart qty is shown
            //Else it will show unwanted console error till we get the user object
            $scope.get_total = function () {
                var total_qty = 0;
                for (var i = 0; i < sharedCartService.cart_items.length; i++) {
                    total_qty += sharedCartService.cart_items[i].item_qty;
                }
                return total_qty;
            };

        } else {

            $ionicSideMenuDelegate.toggleLeft(); //To close the side bar
            $ionicSideMenuDelegate.canDragContent(false); // To remove the sidemenu white space

            $ionicHistory.nextViewOptions({
                historyRoot: true
            });
            $rootScope.extras = false;
            sharedUtils.hideLoading();
            $state.go('tabsController.login', {}, {
                location: "replace"
            });
        }
    });

    
    $scope.logout = function () {

        sharedUtils.showLoading();

        // Main Firebase logout
        firebase.auth().signOut().then(function () {


            $ionicSideMenuDelegate.toggleLeft(); //To close the side bar
            $ionicSideMenuDelegate.canDragContent(false); // To remove the sidemenu white space

            $ionicHistory.nextViewOptions({
                historyRoot: true
            });

            $rootScope.extras = false;
            sharedUtils.hideLoading();
            $state.go('tabsController.login', {}, {
                location: "replace"
            });

        }, function (error) {
            sharedUtils.showAlert("Error", "Logout Failed")
        });
    }
})

.controller('settingsCtrl', function ($scope, $rootScope, fireBaseData, $firebaseObject
    , $ionicPopup, $state, $window, $firebaseArray, sharedUtils) {
    //Bugs are most prevailing here
    $rootScope.extras = true;

    //Shows loading bar
    sharedUtils.showLoading();

    //Check if user already logged in
    firebase.auth().onAuthStateChanged(function (user) {
        if (user) {

            //Accessing an array of objects using firebaseObject, does not give you the $id , so use firebase array to get $id
            $scope.addresses = $firebaseArray(fireBaseData.refUser().child(user.uid).child("address"));

            // firebaseObject is good for accessing single objects for eg:- telephone. Don't use it for array of objects
            $scope.user_extras = $firebaseObject(fireBaseData.refUser().child(user.uid));

            $scope.user_info = user; //Saves data to user_info
            //NOTE: $scope.user_info is not writable ie you can't use it inside ng-model of <input>

            //You have to create a local variable for storing emails
            $scope.data_editable = {};
            $scope.data_editable.email = $scope.user_info.email; // For editing store it in local variable
            $scope.data_editable.password = "";

            $scope.$apply();

            sharedUtils.hideLoading();
        }
    });


    $scope.save = function (extras, editable) {
        if (extras.storeClosedTitle != "" && extras.storeClosedTitle != null) {
            //Update  Telephone
            fireBaseData.refStoreControl().update({ // set
                storeClosedTitle: extras.storeClosedTitle
            });
            $scope.storeClosedTitle = extras.storeClosedTitle;
        }

        if (extras.storeClosedMessage != "" && extras.storeClosedMessage != null) {
            //Update  Telephone
            fireBaseData.refStoreControl().update({ // set
                storeClosedMessage: extras.storeClosedMessage
            });
            $scope.storeClosedMessage = extras.storeClosedMessage;
        }
        // Simple Reload
        $window.location.reload(true);
    };

    $scope.cancel = function () {
        // Simple Reload
        $window.location.reload(true);
        console.log("CANCEL");
    }

    $scope.toggleStore = function () {
        if($scope.storeOpenStatus) {
            // Store is now open. Close it
            $scope.storeStatusText = "Closed"
            $scope.storeButtonText = "Open Store";
            $scope.storeOpenStatus = false;
            fireBaseData.refStoreControl().update({
                "storeOpenStatus": false
            });
        }
        else{
            // Store is now closed. Open it
            $scope.storeStatusText = "Open"
            $scope.storeButtonText = "Close Store";
            $scope.storeOpenStatus = true;
            fireBaseData.refStoreControl().update({
                "storeOpenStatus": true
            });
        }
    } 
    
    $scope.initSettings = function () {
        // Load store setting
        fireBaseData.refStoreControl().once("value", function (snapshot) {
            $scope.storeOpenStatus = snapshot.val().storeOpenStatus;
            $scope.storeClosedTitle = snapshot.val().storeClosedTitle;
            $scope.storeClosedMessage = snapshot.val().storeClosedMessage;
            
            if($scope.storeOpenStatus) {
                $scope.storeStatusText = "Open"
                $scope.storeButtonText = "Close Store"
            }
            else{
                $scope.storeStatusText = "Closed"
                $scope.storeButtonText = "Open Store"
            }            
        });
    }
})

.controller('supportCtrl', function ($scope, $rootScope) {

    $rootScope.extras = true;

})

.controller('forgotPasswordCtrl', function ($scope, $rootScope) {
    $rootScope.extras = false;
})
