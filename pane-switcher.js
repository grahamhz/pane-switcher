angular.module('pane-switcher-example').directive('paneSwitcher', ['$rootScope', '$compile', '$animate',
    function($rootScope, $compile, $animate)
    {
        var paneSwitcherDirective = {
            restrict: 'E',
            replace: true,
            templateUrl: 'public/partials/templates/directives/paneSwitcher.html'
        };

        paneSwitcherDirective.scope = {
            control: '=',
            config: '=',
            data: '=',
            startingPane: '@'
        };

        paneSwitcherDirective.link = function($scope, element)
        {
            // stacks to track panes and popups
            var viewStack = [];
            var popupStack = [];

            // used to string match bootstrap column classes for resizing
            var allColumnClasses = 'col-xs-1 col-xs-2 col-xs-3 col-xs-4 col-xs-5 col-xs-6 col-xs-7 col-xs-8 col-xs-9 col-xs-10 col-xs-11 col-xs-12';

            $scope.popup = null;

            /**
             * pushes a pane onto the stack, compiles, and displays it
             * @param {String} tag: tag of html element to create
             * @param {Array}{Object} attrs: array of attr objects defined as:
             * {
             *   key: key of html attr
             *   value: value of html attr
             * }
             */
            $scope.control.push_pane = function(tag, attrs)
            {
                // create a container for the pane with a unique id, add relevant classes
                var container = angular.element(document.createElement('div'));
                container.attr('id', "pane-" + viewStack.length); // add id
                container.addClass('pane-switcher-pane'); // add class
                container.addClass($scope.config.getColumnWidthClass());

                // compile it and add it to the page
                $compile(container)($scope);
                element.find('#pane-switcher').append(container);

                // build new pane
                var object = angular.element(document.createElement(tag)); // create element
                object.attr('control', 'control'); // add reference to pane switch control object
                object.attr('data', 'data'); // add reference to data needed for children
                object.attr('tag', tag);
                object.addClass('pane-enter'); // animation class

                // add passed in attributes to the pane
                if(attrs !== null && attrs !== undefined)
                {
                    for(var i = 0; i < attrs.length; i++)
                    {
                        object.attr(attrs[i].key, attrs[i].value);
                    }
                }

                // compile, push, adjust
                $compile(object)($scope);

                // create an object that contains information I'll need later and add it to view stack
                var viewStackObj = {
                    tag: tag,
                    level: viewStack.length,
                    object: container
                };
                viewStack.push(viewStackObj);

                // animate it
                $animate.enter(object, container); // I removed parent and changed it to container, will this work?

                adjust_columns($scope.config.getNumberActivePanes(), $scope.config.getColumnWidthClass());
            };


            /**
             * pops the top (right-most) pane off of the view stack,
             * removes from dom
             */
            $scope.control.pop_pane = function()
            {
                if(viewStack.length >= 1)
                {
                    var pane = viewStack.pop();
                    $animate.leave(pane.object);
                    //pane.object.remove();
                }
            };


            /**
             * begins popping panes from top of stack. stops after
             * popping the first occurrence (from the top) of the
             * given tag
             * @param {String} tag: tag at which to stop popping
             */
            $scope.control.pop_panes_to_tag = function(tag)
            {
                if(!$scope.control.check_for_tag(tag))
                {
                    return;
                }

                // save the number of elements
                var count = viewStack.length;

                // pop and remove panes
                while(count > 0)
                {
                    // pop the pane and remove it from the page
                    var pane = viewStack.pop();
                    pane.object.remove();

                    // break after I've removed the supplied tag
                    if(pane.tag === tag)
                    {
                        adjust_columns($scope.config.getNumberActivePanes(), $scope.config.getColumnWidthClass());
                        return;
                    }

                    count--;
                }
            };


            /**
             * pops panes up to (but not including) tag
             * @param {String} tag
             */
            $scope.control.pop_panes_up_to_tag = function(tag)
            {
                // find the tag on top of the tag supplied
                var previousTag = null;
                for(var i = viewStack.length - 1; i >= 0; i--)
                {
                    if(viewStack[i].tag === tag)
                    {
                        // if it's the top element
                        if(previousTag === null)
                        {
                            return;
                        }

                        break;
                    }

                    // set previous tag
                    previousTag = viewStack[i].tag;
                }

                // call pop panes to tag
                $scope.control.pop_panes_to_tag(previousTag);
            };


            /**
             * peeks at the top tag in the stack
             * @returns {String}
             */
            $scope.control.peek_pane = function()
            {
                if(viewStack.length >= 1)
                {
                    return viewStack[viewStack.length - 1].tag;
                }
                else
                {
                    return null;
                }
            };


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
                $scope.popup = popup;

                if(popupStack.length >= 1)
                {
                    var popup = popupStack.pop();
                    popup.object.remove();
                }

                // build new popup
                var popup = angular.element(document.createElement(tag)); // create element
                popup.attr('data', 'popup'); // add reference to data needed for popup
                popup.addClass('popup-enter');

                if(attrs !== null && attrs !== undefined)
                {
                    for(var i = 0; i < attrs.length; i++)
                    {
                        popup.attr(attrs[i].key, attrs[i].value);
                    }
                }

                // compile, push, adjust
                $compile(popup)($scope);
                var container = element.find('#pane-switcher-popup-container').append(popup);

                var popupStackObj = {
                    tag: tag,
                    level: popupStack.length,
                    object: popup
                };

                popupStack.push(popupStackObj);

                $animate.enter(popup, container);
            };



            /**
             * pops the top (should be the only one) popup off of the popup stack,
             * removes from dom
             */
            $scope.control.pop_popup = function()
            {
                if(popupStack.length >= 1)
                {
                    var popup = popupStack.pop();
                    $animate.leave(popup.object);
                }
            };


            /**
             * Checks the stack for a pane of a specific tag
             * @returns {boolean}
             */
            $scope.control.check_for_tag = function(tag)
            {
                for(var i = 0; i < viewStack.length; i++)
                {
                    if(viewStack[i].tag === tag)
                    {
                        return true;
                    }
                }
                return false;
            };


            $scope.control.first_index_of_tag = function(tag)
            {
                for(var i = 0; i < viewStack.length; i++)
                {
                    if(viewStack[i].tag === tag)
                    {
                        return i;
                    }
                }
                return -1;
            };


            /** Initialize **/

            $scope.control.push_pane($scope.startingPane);


            /** Watchers **/

            for(var i = 0; i < $scope.config.widthWatchers.length; i++)
            {
                $scope.$watch($scope.config.widthWatchers[i], function()
                {
                    adjust_columns($scope.config.getNumberActivePanes(), $scope.config.getColumnWidthClass());
                });
            }

            /** Functions **/


            /**
             * adjusts the columns to display and calls a resize method
             * @param {int} numVisible: number of visible panes possible
             * @param {String} columnClass: the class to give columns based on size
             */
            function adjust_columns(numVisible, columnClass)
            {
                // if I don't have room to show everything
                if(viewStack.length >= numVisible)
                {
                    for(var i = 0; i < viewStack.length; i++)
                    {
                        if(viewStack.length - numVisible > i)
                        {
                            // hide
                            viewStack[i].object.removeClass('visible');
                            viewStack[i].object.addClass('invisible');
                        }
                        else
                        {
                            // show
                            viewStack[i].object.removeClass('invisible');
                            viewStack[i].object.addClass('visible');
                        }
                    }
                }
                else // if everything can fit
                {
                    // show them all
                    for(var i = 0; i < viewStack.length; i++)
                    {
                        viewStack[i].object.removeClass('invisible');
                        viewStack[i].object.addClass('visible');
                    }
                }

                set_column_width(columnClass);
            }


            /**
             * sets all panes' column width class
             * supposed to work with bootstrap
             * @param {String} className: the class to give columns based on size
             */
            function set_column_width(className)
            {
                angular.element('.pane-switcher-pane').removeClass(allColumnClasses);
                angular.element('.pane-switcher-pane').addClass(className);
            }


            /**
             * makes the top pane in the stack visible
             */
            function show_top_pane()
            {
                viewStack[viewStack.length - 1].object.removeClass('invisible');
                viewStack[viewStack.length - 1].object.addClass('visible');
            }


            $scope.$emit('pane_switcher_ready');
        };

        return paneSwitcherDirective;
    }
]);