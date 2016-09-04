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

    
// Display and control the main category page
.controller('manageMenuCtrl', function ($scope, $rootScope, $ionicSideMenuDelegate, fireBaseData, $state
    , $ionicHistory, $firebaseArray, sharedCartService, sharedUtils) {

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


// Display List of Orders from Customers
.controller('manageOrderCtrl', function ($scope, $rootScope, $ionicSideMenuDelegate, fireBaseData, $state
    , $ionicHistory, $firebaseArray, sharedCartService, sharedUtils) {

    //Check if user already logged in
    firebase.auth().onAuthStateChanged(function (user) {
        if (user) {
            $scope.user_info = user; //Saves data to user_info

        } else {

            $ionicSideMenuDelegate.toggleLeft(); //To close the side bar
            $ionicSideMenuDelegate.canDragContent(false); // To remove the sidemenu white space

            // Retrieve Store Open Status
            fireBaseData.refStoreControl().once("value", function (snapshot) {
                $scope.storeOpenStatus = snapshot.val().storeOpenStatus;
            });
            
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
                // reload the orders
                $state.transitionTo($state.current, $state.$current.params, { 
                  reload: true, inherit: false, notify: true
                });
            });
        }
    });

    $scope.initManageOrder = function(){
        $scope.Orders = $firebaseArray(fireBaseData.refOrders());
    }
    
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
    
    $scope.goToOrder = function (){
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
    , $ionicHistory, $firebaseArray, sharedCartService, sharedUtils) {

    //Check if user already logged in
    firebase.auth().onAuthStateChanged(function (user) {
        if (user) {
            $scope.user_info = user; //Saves data to user_info

        } else {

            $ionicSideMenuDelegate.toggleLeft(); //To close the side bar
            $ionicSideMenuDelegate.canDragContent(false); // To remove the sidemenu white space

            // Retrieve Store Open Status
            fireBaseData.refStoreControl().once("value", function (snapshot) {
                $scope.storeOpenStatus = snapshot.val().storeOpenStatus;
            });
            
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
    $scope.cancelOrder = function (){
    }
    $scope.confirmOrder = function (){
    }
    $scope.orderReady = function (){
    }
})


// Display and control items in menu category
.controller('manageItemCtrl', function ($scope, $rootScope, $ionicSideMenuDelegate, fireBaseData, $state
    , $ionicHistory, $firebaseArray, sharedCartService, sharedUtils) {

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

        $scope.current_category = $rootScope.current_category;
        $scope.category_name = $rootScope.category_name;
        
        sharedUtils.hideLoading();
    }

    $scope.addToCart = function (item) {

        // Check if there are subcategory
        
        fireBaseData.refMenu().child(item.$id).once("value", function (snapshot) {
            if(snapshot.val().subcategory) {
                // This item has subcategory. Let's bring up the subcategory menu
                $rootScope.current_subcategory = item.$id+'_subcategory'; //Save current category id
                $rootScope.item_name = snapshot.val().name;

                $state.go('subcategoryitem', {}, {
                    location: "replace"
                });
                return;
            }
            else {
                // else, add the item to cart
                sharedCartService.add(item);    
            }
        });
    };
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
    , $ionicPopup, $state, $window, $firebaseArray
    , sharedUtils) {
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

    $scope.addManipulation = function (edit_val) { // Takes care of address add and edit ie Address Manipulator


        if (edit_val != null) {
            $scope.data = edit_val; // For editing address
            var title = "Edit Address";
            var sub_title = "Edit your address";
        } else {
            $scope.data = {}; // For adding new address
            var title = "Add Address";
            var sub_title = "Add your new address";
        }
        // An elaborate, custom popup
        var addressPopup = $ionicPopup.show({
            template: '<input type="text"   placeholder="Nick Name"  ng-model="data.nickname"> <br/> ' +
                '<input type="text"   placeholder="Address" ng-model="data.address"> <br/> ' +
                '<input type="number" placeholder="Pincode" ng-model="data.pin"> <br/> ' +
                '<input type="number" placeholder="Phone" ng-model="data.phone">'
            , title: title
            , subTitle: sub_title
            , scope: $scope
            , buttons: [
                {
                    text: 'Close'
}

                , {
                    text: '<b>Save</b>'
                    , type: 'button-positive'
                    , onTap: function (e) {
                        if (!$scope.data.nickname || !$scope.data.address || !$scope.data.pin || !$scope.data.phone) {
                            e.preventDefault(); //don't allow the user to close unless he enters full details
                        } else {
                            return $scope.data;
                        }
                    }
}
]
        });

        addressPopup.then(function (res) {

            if (edit_val != null) {
                //Update  address
                fireBaseData.refUser().child($scope.user_info.uid).child("address").child(edit_val.$id).update({ // set
                    nickname: res.nickname
                    , address: res.address
                    , pin: res.pin
                    , phone: res.phone
                });
            } else {
                //Add new address
                fireBaseData.refUser().child($scope.user_info.uid).child("address").push({ // set
                    nickname: res.nickname
                    , address: res.address
                    , pin: res.pin
                    , phone: res.phone
                });
            }

        });

    };

    // A confirm dialog for deleting address
    $scope.deleteAddress = function (del_id) {
        var confirmPopup = $ionicPopup.confirm({
            title: 'Delete Address'
            , template: 'Are you sure you want to delete this address'
            , buttons: [
                {
                    text: 'No'
                    , type: 'button-stable'
}

                , {
                    text: 'Yes'
                    , type: 'button-assertive'
                    , onTap: function () {
                        return del_id;
                    }
}
]
        });

        confirmPopup.then(function (res) {
            if (res) {
                fireBaseData.refUser().child($scope.user_info.uid).child("address").child(res).remove();
            }
        });
    };

    $scope.save = function (extras, editable) {
        //1. Edit Telephone doesnt show popup 2. Using extras and editable  // Bugs
        if (extras.telephone != "" && extras.telephone != null) {
            //Update  Telephone
            fireBaseData.refUser().child($scope.user_info.uid).update({ // set
                telephone: extras.telephone
            });
        }

        //Edit Password
        if (editable.password != "" && editable.password != null) {
            //Update Password in UserAuthentication Table
            firebase.auth().currentUser.updatePassword(editable.password).then(function (ok) {}, function (error) {});
            sharedUtils.showAlert("Account", "Password Updated");
        }

        //Edit Email
        if (editable.email != "" && editable.email != null && editable.email != $scope.user_info.email) {

            //Update Email/Username in UserAuthentication Table
            firebase.auth().currentUser.updateEmail(editable.email).then(function (ok) {
                $window.location.reload(true);
                //sharedUtils.showAlert("Account","Email Updated");
            }, function (error) {
                sharedUtils.showAlert("ERROR", error);
            });
        }

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
            fireBaseData.refStoreControl().set({
                "storeOpenStatus": false
            });
        }
        else{
            // Store is now closed. Open it
            $scope.storeStatusText = "Open"
            $scope.storeButtonText = "Close Store";
            $scope.storeOpenStatus = true;
            fireBaseData.refStoreControl().set({
                "storeOpenStatus": true
            });
        }
        
        

    } 
    
    $scope.initSettings = function () {
        // Load store setting
        fireBaseData.refStoreControl().once("value", function (snapshot) {
            $scope.storeOpenStatus = snapshot.val().storeOpenStatus;
            
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

.controller('checkoutCtrl', function ($scope, $rootScope, sharedUtils, $state, $firebaseArray
    , $ionicHistory, fireBaseData, $ionicPopup, sharedCartService) {

    $rootScope.extras = true;

    //Check if user already logged in
    firebase.auth().onAuthStateChanged(function (user) {
        if (user) {
            $scope.addresses = $firebaseArray(fireBaseData.refUser().child(user.uid).child("address"));
            $scope.user_info = user;
        }
    });

    $scope.payments = [
        {
            id: 'CREDIT'
            , name: 'Credit Card'
        }
        , {
            id: 'NETBANK'
            , name: 'Net Banking'
        }
        , {
            id: 'COD'
            , name: 'COD'
        }
    ];

    $scope.pay = function (address, payment) {

        if (address == null || payment == null) {
            //Check if the checkboxes are selected ?
            sharedUtils.showAlert("Error", "Please choose from the Address and Payment Modes.")
        } else {
            // Loop throw all the cart item
            for (var i = 0; i < sharedCartService.cart_items.length; i++) {
                //Add cart item to order table
                fireBaseData.refOrder().push({

                    //Product data is hardcoded for simplicity
                    product_name: sharedCartService.cart_items[i].item_name
                    , product_price: sharedCartService.cart_items[i].item_price
                    , product_image: sharedCartService.cart_items[i].item_image
                    , product_id: sharedCartService.cart_items[i].$id,

                    //item data
                    item_qty: sharedCartService.cart_items[i].item_qty,

                    //Order data
                    user_id: $scope.user_info.uid
                    , user_name: $scope.user_info.displayName
                    , address_id: address
                    , payment_id: payment
                    , status: "Queued"
                });

            }

            //Remove users cart
            fireBaseData.refCart().child($scope.user_info.uid).remove();

            sharedUtils.showAlert("Info", "Order Successfull");

            // Go to past order page
            $ionicHistory.nextViewOptions({
                historyRoot: true
            });
            $state.go('lastOrders', {}, {
                location: "replace"
                , reload: true
            });
        }
    }



    $scope.addManipulation = function (edit_val) { // Takes care of address add and edit ie Address Manipulator


        if (edit_val != null) {
            $scope.data = edit_val; // For editing address
            var title = "Edit Address";
            var sub_title = "Edit your address";
        } else {
            $scope.data = {}; // For adding new address
            var title = "Add Address";
            var sub_title = "Add your new address";
        }
        // An elaborate, custom popup
        var addressPopup = $ionicPopup.show({
            template: '<input type="text"   placeholder="Nick Name"  ng-model="data.nickname"> <br/> ' +
                '<input type="text"   placeholder="Address" ng-model="data.address"> <br/> ' +
                '<input type="number" placeholder="Pincode" ng-model="data.pin"> <br/> ' +
                '<input type="number" placeholder="Phone" ng-model="data.phone">'
            , title: title
            , subTitle: sub_title
            , scope: $scope
            , buttons: [
                {
                    text: 'Close'
}

                , {
                    text: '<b>Save</b>'
                    , type: 'button-positive'
                    , onTap: function (e) {
                        if (!$scope.data.nickname || !$scope.data.address || !$scope.data.pin || !$scope.data.phone) {
                            e.preventDefault(); //don't allow the user to close unless he enters full details
                        } else {
                            return $scope.data;
                        }
                    }
}
]
        });

        addressPopup.then(function (res) {

            if (edit_val != null) {
                //Update  address
                fireBaseData.refUser().child($scope.user_info.uid).child("address").child(edit_val.$id).update({ // set
                    nickname: res.nickname
                    , address: res.address
                    , pin: res.pin
                    , phone: res.phone
                });
            } else {
                //Add new address
                fireBaseData.refUser().child($scope.user_info.uid).child("address").push({ // set
                    nickname: res.nickname
                    , address: res.address
                    , pin: res.pin
                    , phone: res.phone
                });
            }

        });

    };


})