angular.module('pane-switcher-example').directive('paneSwitcher', ['$rootScope', '$compile', '$animate',
    function($rootScope, $compile, $animate)
    {
        var paneSwitcherDirective = {
            restrict: 'E',
            replace: true,
            templateUrl: 'paneSwitcher.html'
        };

        paneSwitcherDirective.scope = {
            control: '=',
            config: '='
        };

        paneSwitcherDirective.link = function($scope, element)
        {
            // stack to track popups
            var popupStack = [];
            // cache of popup attributes/scope
            $scope.popup = null;


            /**
             * compiles and pushes a popup onto the view stack
             * @param {String} tag
             * @param {Array}{Object} attrs
             * {
             *   key: key of html attr
             *   value: value of html attr
             * }
             * @param {Object} popup: data needed for popup
             */
            $scope.control.push_popup = function(tag, attrs, popup)
            {
                // optionally limit the number of popups on screen
                if(popupStack.length >= 1)
                {
                    $scope.control.pop_popup();
                }

                // save a reference to the scope of this popup
                $scope.popup = popup;

                // create element where tag is the name of the popup directive you're creating
                var popupElem = angular.element(document.createElement(tag));
                // add attribute to element so it can access the popup object we just set on this scope
                popupElem.attr('data', 'popup');
                // add any relevant classes
                popupElem.addClass('popup-enter');

                // add any attributes passed in through attr parameter
                if(attrs !== null && attrs !== undefined)
                {
                    for(var i = 0; i < attrs.length; i++)
                    {
                        popupElem.attr(attrs[i].key, attrs[i].value);
                    }
                }

                // compile the popup with this scope
                $compile(popupElem)($scope);
                // find the container I set up in the pane-switcher's HTML template
                var container = element.find('#pane-switcher-popup-container');

                // save anything you want in the popup stack and push it
                var popupStackObj = {
                    tag: tag,
                    level: popupStack.length,
                    object: popupElem
                };
                popupStack.push(popupStackObj);

                // animate the popup entering
                $animate.enter(popupElem, container);
                console.log($scope.popup);
            };



            /**
             * pops the top (should be the only one) popup off of the popup stack,
             * removes from dom
             */
            $scope.control.pop_popup = function()
            {
                if(popupStack.length >= 1)
                {
                    // take it off the top!
                    var popup = popupStack.pop();
                    // you can even animate the popup leaving the page!
                    // This will remove the element from the page upon completion
                    $animate.leave(popup.object);
                    // popup.object.remove(); if you don't want to animate it
                }
            };



            /** Optionally Set Up Watchers from Config Object **/

            for(var i = 0; i < $scope.config.widthWatchers.length; i++)
            {
                $scope.$watch($scope.config.widthWatchers[i], function()
                {
                    // do something
                });
            }

            // Optionally let a parent know that the pane switcher control object is done setting up
            $scope.$emit('pane_switcher_ready');
        };

        return paneSwitcherDirective;
    }
]);