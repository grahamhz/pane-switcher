---
author: Graham Zuber
title: "Popups are an ng-Pain!"
layout: post
categories:
  - programming
tags:
  - angularjs
  - popups
  - web
header-image: img/posts/13903385550_62b8ac45c4_o-300x200.jpg
---

## What is this?
This post is all about a smart way to manage your popups in AngularJS. It can also be extended to make your monolithic controllers and HTML templates more manageable (sweet, sweet modularization).

## Why is this?
Recently, I created an app for a client that wanted to mimic the behavior of their mobile apps. The idea was to "stack" the mobile page views side by side in order to use the increased screen size. Making sense? No? That's fine, it's not really relevant to this article.

To fulfill these layout needs, I developed something I like to call the pane-switcher (which has become infamous here at Pixio; mainly because I won't shut up about it). The pane-switcher is essentially a system for compiling AngularJS directives when you need them and removing them from the page entirely when you're done with them. It's called the pane-switcher because I created for a reason unrelated to popups, but in the process of creating it I realized it could solve my popup problems.

> Note:
> I was trying to mimic mobile development practices where you can create a view, it takes care of user input, and calls a callback before destroying itself. 

## Ugh, I hate popups...
I'm with you there. Popups are something that I've always wanted to do better in AngularJS. I've tried many different solutions, none of which with I was satisfied. Have you ever ended up with 4 or 5 popups in your HTML template with "visibility bools" tied to an `ng-show` attribute for each one?

Shhh, no more tears. Only pane-switcher now.

## Let's get down to business
The pane-switcher begins and ends with AngularJS directives. It maintains a stack for popups. One could argue that all we need for the popup is a single object variable, but maybe you want multiple layers of popups. Maybe not. Point is that you could, I don't know your life. 

It dynamically (and programmatically) builds HTML elements. It then compiles them using the AngularJS `$compile` object into the directive that corresponds to their HTML element tag.

Let's start an example to show off the pane-switcher! For a more in-depth example, please see the repo I set up on [my GitHub][pane-switcher].

#### Setting up the pane switcher

Place the pane-switcher directive into our `ng-view` template:
```html
<pane-switcher control="paneSwitcherCtrl" config="paneSwitcherConfig"></pane-switcher>
```
These are objects that were created in the parent controller of the pane switcher. Let's go over each one:

#### `control`
The `control` property is an object that represents the functionality needed to add/delete things from the pane-switcher. It's an empty object that the pane-switcher adds methods to in order to allow the controller to manipulate the popups on screen later.
```javascript
$scope.paneSwitcherCtrl = {};
```

#### `config`
This is a config object for the pane-switcher. You can fill this object with anything! In this example, I define properties for the pane-switcher to watch from the root scope in order to keep track of significant width-change events (this way, the pane-switcher could potentially notify any popups that need to change their properties if, say, the browser window gets shrunk to a mobile resolution).
```javascript
$scope.paneSwitcherConfig = {
    widthWatchers: [
        '$root.isMobile',
        '$root.showSideMenu'
    ]
};
```

#### Creating the pane switcher
##### Scope
Let's define the scope of the pane-switcher directive:
```javascript
paneSwitcherDirective.scope = {
    control: '=',
    config: '='
};
```
This is a basic AngularJS directive property. Basically, I'm setting up `control` and `config` in the pane-switcher's scope to be references to objects also referenced in my controller. This is what allows me to attach methods to `control`, which my controller can call later. For more info about directives and this '=' syntax, see the [AngularJS documentation](https://docs.angularjs.org/guide/directive).

> Note:
> I'm also limiting the scope of the pane-switcher so that it can't access anything the controller doesn't want it to. Encapsulation, baby.

##### Link Function

Let's start building the pane-switcher's main functionality. The most important part of the pane-switcher is the ability to push and pop and popup.

##### Pushing a Popup onto the Stack
Let's create a function so the controller can push a popup onto the stack. This is the sweet magic sauce that is the pane switcher.

>Note:
>You'll notice I define this function on the `control` object to which the pane-switcher and controller share references. This allows the controller access to these functions in order to call them later.

```javascript
/**
 * pushes a popup onto the stack, compiles, and displays it
 * @param {String} tag: tag of html element to create
 * @param {Array}{Object} attrs: array of attr objects defined as:
 * {
 *   key: key of html attr
 *   value: value of html attr
 * }
 * @param {Object} popup: object that defines the scope of the new popup
 */
$scope.control.push_popup = function(tag, attrs, popup)
{
    // optionally limit the number of popups on screen
    if(popupStack.length >= 1)
    {
        $scope.control.pop_popup();
    }

    // create element where tag is the name of the popup directive you're creating
    var popup = angular.element(document.createElement(tag));
    // save a reference to the scope of this popup
    $scope.popup = popup;
    // add attribute to element so it can access the popup object we just set on this scope
    popup.attr('data', 'popup');
     // add any relevant classes
    popup.addClass('popup-enter');

	// add any attributes passed in through attr parameter
    if(attrs !== null && attrs !== undefined)
    {
        for(var i = 0; i < attrs.length; i++)
        {
            popup.attr(attrs[i].key, attrs[i].value);
        }
    }

    // compile the popup with this scope
    $compile(popup)($scope);
    // find the container I set up in the pane-switcher's HTML template
    var container = element.find('#pane-switcher-popup-container');

	// save anything you want in the popup stack and push it
    var popupStackObj = {
        tag: tag,
        level: popupStack.length,
        object: popup
    };
    popupStack.push(popupStackObj);

	// animate the popup entering
    $animate.enter(popup, container);
};
```
This may seem complex, but it's really not. I've explained the majority of the functionality in the comments. It's really just there to push the popup onto the stack, making sure that it's fully compiled and set up with its directive attributes.

##### Let's Pop that Popup
At this point, popping a popup is super easy! Let's define that functionality.
```javascript
/**
 * pops the top pane off of the view stack,
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
```

#### Using the Pane Switcher
Now let's use it! From my controller, I can create a new popup.
```javascript
var attrs = [
	{ key: "class", value: "some-class-I-dunno" }
];

var popup = {
    elementId: 'cool-popup',
    title: 'This is a title!',
    confirmButtonText: 'I Concur',
    cancelButtonText: 'Meh',
    confirmButtonClass: 'css-class-for-confirm-button',
    cancelButtonClass: 'css-class-for-cancel-button',
    confirmButtonCallback: function(){ confirm(); },
    cancelButtonCallback: function(){ cancel(); }
}
$scope.paneSwitcherCtrl.push_popup('totally-cool-popup', attrs, popup);
```
And there you have it! This assumes that you have a directive in your AngularJS app called `totallyCoolPopup`. This will create an instance of that directive and animate it onto the page! You'll also need to hook up `confirm()` and `cancel()` to remove the popup and then do whatever you want it to.

In order for this to work, the HTML template for `totallyCoolPopup` might look something like this:
```html
<div id="{{ data.elementId }}">
    <h1>{{ data.title }}</h1>
    <button ng-click="data.confirmButtonCallback()" class={{ data.confirmButtonClass }}>{{ confirmButtonText }}</button>
    <button ng-click="data.cancelButtonCallback()" class={{ data.cancelButtonClass }}>{{ cancelButtonText }}</button>
</div>
```

## Conclusion
If you've ever been annoyed by poor implementations of popups in AngularJS apps, the pane-switcher is here for you. You could also use this for normal page content! If you have an element that disappears from or is inserted into your layout, consider this solution! It wouldn't be hard to adapt this to do more than just popups (as I did). I will say, however, that if you're going to use this for more than popups (especially if it involves tracking state) consider the [ui-router](https://github.com/angular-ui/ui-router).

If you'd like more complete source code, checkout my example repo on [GitHub][pane-switcher].

[pane-switcher]: https://github.com/grahamhz/pane-switcher
