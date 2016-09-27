angular.module('app.services', []).factory('fireBaseData', function ($firebase) {
    var ref = new Firebase("https://eatat-d0089.firebaseio.com/")

        // DataStore for Firebase, user login
        , refUser = new Firebase("https://eatat-d0089.firebaseio.com/users")
        , refFbProvider = new firebase.auth.FacebookAuthProvider()
    
        // DataStore for each user
        , refCart = new Firebase("https://eatat-d0089.firebaseio.com/cart")
        , refFeatured = new Firebase("https://eatat-d0089.firebaseio.com/featured")

        // DataStore for Restaurant
        , refCategory = new Firebase("https://eatat-d0089.firebaseio.com/category")
        , refMenu = new Firebase("https://eatat-d0089.firebaseio.com/menu")
        , refStoreControl = new Firebase("https://eatat-d0089.firebaseio.com/storeControl")
        , refOrders = new Firebase("https://eatat-d0089.firebaseio.com/orders")
    
    // what scope we want to add in, so that we request these from FB Profile
    refFbProvider.addScope('user_birthday');
    
    return {
        ref: function () {
            return ref;
        }
        , refUser: function () {
            return refUser;
        }
        , refFbProvider: function () {
            return refFbProvider;
        }
        , refCart: function () {
            return refCart;
        }
        , refOrders: function () {
            return refOrders;
        }
        , refFeatured: function () {
            return refFeatured;
        }
        , refCategory: function () {
            return refCategory;
        }
        , refMenu: function () {
            return refMenu;
        }
        , refStoreControl: function () {
            return refStoreControl;
        }
    }
}).factory('sharedUtils', ['$ionicLoading', '$ionicPopup', function ($ionicLoading, $ionicPopup) {
    var functionObj = {};
    functionObj.showLoading = function () {
        $ionicLoading.show({
            content: '<i class=" ion-loading-c"></i> ', // The text to display in the loading indicator
            animation: 'fade-in', // The animation to use
            showBackdrop: true, // Will a dark overlay or backdrop cover the entire view
            maxWidth: 200, // The maximum width of the loading indicator. Text will be wrapped if longer than maxWidth
            showDelay: 0 // The delay in showing the indicator
        });
    };
    functionObj.hideLoading = function () {
        $ionicLoading.hide();
    };
    functionObj.showAlert = function (title, message) {
        var alertPopup = $ionicPopup.alert({
            title: title
            , template: message
        });
    };
    return functionObj;
}])
    
.factory('sharedCartService', ['$ionicPopup', 'fireBaseData', '$firebaseArray', function ($ionicPopup, fireBaseData, $firebaseArray) {
    var uid; // uid is temporary user_id
    var cart = {}; // the main Object
    //Check if user already logged in
    firebase.auth().onAuthStateChanged(function (user) {
        if (user) {
            uid = user.uid;
            cart.cart_items = $firebaseArray(fireBaseData.refCart().child(uid));
        }
    });
    //Add to Cart
    cart.add = function (item) {
        //check if item is already added or not
        fireBaseData.refCart().child(uid).once("value", function (snapshot) {
            if (snapshot.hasChild(item.$id) == true) {
                //if item is already in the cart
                var currentQty = snapshot.child(item.$id).val().item_qty;
                fireBaseData.refCart().child(uid).child(item.$id).update({ // update
                    item_qty: currentQty + 1
                });
            }
            else {
                //if item is new in the cart
                fireBaseData.refCart().child(uid).child(item.$id).set({ // set
                    item_name: item.name
                    , item_price: item.price
                    , item_qty: 1
                });
            }
            var alertPopup = $ionicPopup.alert({
                title: "Done"
                , template: "You have added\n " + item.name + " to your tray"
            });
        });
    };
    cart.drop = function (item_id) {
        fireBaseData.refCart().child(uid).child(item_id).remove();
    };
    cart.increment = function (item_id) {
        //check if item is exist in the cart or not
        fireBaseData.refCart().child(uid).once("value", function (snapshot) {
            if (snapshot.hasChild(item_id) == true) {
                var currentQty = snapshot.child(item_id).val().item_qty;
                //check if currentQty+1 is less than available stock
                fireBaseData.refCart().child(uid).child(item_id).update({
                    item_qty: currentQty + 1
                });
            }
            else {
                //pop error
            }
        });
    };
    cart.decrement = function (item_id) {
        //check if item is exist in the cart or not
        fireBaseData.refCart().child(uid).once("value", function (snapshot) {
            if (snapshot.hasChild(item_id) == true) {
                var currentQty = snapshot.child(item_id).val().item_qty;
                if (currentQty - 1 <= 0) {
                    cart.drop(item_id);
                }
                else {
                    fireBaseData.refCart().child(uid).child(item_id).update({
                        item_qty: currentQty - 1
                    });
                }
            }
            else {
                //pop error
            }
        });
    };
    return cart;
}])


.factory('BlankFactory', [function () {}]).service('BlankService', [function () {}]);