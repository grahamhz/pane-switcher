uthor: Graham Zuber
layout: post
categories:
  - programming
tags:
  - angularjs
  - popups
  - web
header-image: img/posts/13903385550_62b8ac45c4_o-300x200.jpg
---

# What is this?
This post is all about a smart way to manage your popups in angularjs. It can also be extended to make your monolithic controllers more manageable (sweet, sweet encapsulation).

# Why is this?
Recently, I created an app for a client that wanted to mimic the behavior of their mobile apps. The idea was to "stack" the mobile page views side by side in order to use the increased screen size. Making sense? No? That makes sense - that's why I made an example of the layout below!

<div style="text-align:center"><img src="/img/posts/webapptemplate.png" width="250" /></div>

In this example, there are only ever 2 panes showing at a time. But what happens when the user is four levels deep? I only want to show level 3 and 4, while levels 1 and 2 should be hidden.

# Ah, the problem
This is a classic angularjs problem that I've encountered. I have a bunch of elements that I want on the page, but I don't want to show them all at once! I started thinking about the consequences of having multiple "visibility bools" tied to various ng-show propertied throughout my page, but that sounded like a huge PANE. Once, the thought crossed my mind to have an array of "visibility bools," which is when I knew I had lost it.

## Enter the Pane-Switcher
The infamous pane-switcher was born (I say infamous because everyone at the office got tired of me talking about it constantly).

The pane-switcher is an attempt to architect a system similar to mobile applications where they can instantiate a view or an object, let the view handle any inputs from the user, return the finished changes to the controller when the user hits "Back" or "Save," and let the view delete itself.

It also works incredibly well with popups! I'll show you how to create a popup with just a javascript object and have it delete itself and callback to the controller (or its caller) when it's done.

I accomplish this with directives! The pane switcher maintains two stacks. One for panes and one for popups. It uses directives and the angular $compile object to dynamically (and programmatically) add angular directives to the page when you need them, and remove them completely when you don't.

## Implementation

An example of this set up is available on [my github]:https://github.com/grahamhz/pane-switcher with many comments. Here's a higher-level description:

#### Setting up the pane switcher

The beautiful thing about the pane-switcher is that your ng-view template becomes one line of code.
```javascript
<pane-switcher control="paneSwitcherCtrl" config="paneSwitcherConfig" data="controlData" starting-pane="programs-pane"></pane-switcher>
```
Here, we're inserting the 'pane-switcher' directive into our view. What are these data objects I'm passing in, you ask? They're objects that are created in the parent controller of the pane switcher. Let's go over each one:

##### control
The control property is an object that represents the functionality needed to add/delete things from the pane-switcher. It's an empty object that the pane-switcher can add methods and function to so that the controller can manipulate panes later.
```javascript
$scope.paneSwitcherCtrl = {};
```

##### config
This is a config object for the pane switcher. You can fill this object with anything! I used it for functions that will tell the pane switcher how many panes can be visible at any one time.
```javascript
$scope.paneSwitcherConfig = {
    widthWatchers: [
        '$root.isMobile',
        '$root.showSideMenu'
    ],
    getColumnWidthClass: get_column_width,
    getNumberActivePanes: get_number_active_panes
};
```
Here are some examples of what I did with config. I defined 'widthWatchers' which are global properties that tell me if the browser is within mobile resolutions and whether or not the side menu is showing (which would potentially adjust the column width of my panes). I feel like the other functions are somewhat self-explanatory. 

##### data
Data is just the object that you want to pass to each of your child views (panes).
```javascript
$scope.controlData = {
    object: object,
    "first-pane": {
        save: function(){}
    },
    "second-pane": {
        back: function(){},
        save: function(){}
    }
}
```
For cleanliness and safety, I define properties on the object named after the pane that will need to access them. It's a defacto namespace.

#### Creating the pane switcher
##### Scope
Let's define the scope of the pane-switcher directive:
```javascript
paneSwitcherDirective.scope = {
    control: '=',
    config: '=',
    data: '=',
    startingPane: '@'
};
```
Now we have references to all of our valuable objects, as well as a value for the pane to instantiate on page load.

##### Member Variables
Let's go over the pane switcher's functionality (these methods would go in the link function of the pane-switcher directive).

First of all, we need to create our two stacks.
```javascript
var viewStack = [];
var popupStack = [];
```
As I said, the view stack is for panes while the popup stack is for popups. One could argue that all we need for the popup is a single object variable, but maybe you want multiple layers of popups. Maybe not. Point is that you could, I don't know your life.
##### Pushing a Pane
Next, let's define a function for pushing a pane onto the stack. This is the sweet magic sauce that is the pane switcher.

```javascript
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
    // first, create a parent div container for your new directive
    var container = angular.element(document.createElement('div')); // create the html element that will hold your directive
    container.attr('id', "pane-" + viewStack.length); // add a unique id
    
    // add any classes you might need
    container.addClass('pane-switcher-pane');
    container.addClass($scope.config.getColumnWidthClass());

    // compile the html
    $compile(container)($scope);
    element.find('#pane-switcher').append(container); // add the compiled html to the page (#pane-switcher is the unique id of the parent element of the pane-switcher template)

    // second, build new pane
    var object = angular.element(document.createElement(tag)); // create element
    object.attr('control', 'control'); // add reference to pane switch control object
    object.attr('data', 'data'); // add reference to data needed for children
    object.attr('tag', tag); // let ths pane know what kind of pane it is
    
    // add any relevant classes the the directive itself
    object.addClass('pane-enter'); // animation class

    // loop through all attributes that were passed into the function and add them to your new directive
    if(attrs !== null && attrs !== undefined)
    {
        for(var i = 0; i < attrs.length; i++)
        {
            object.attr(attrs[i].key, attrs[i].value);
        }
    }

    // compile your new directive
    $compile(object)($scope);

    // create a viewstack object with references to info we'll need later
    var viewStackObj = {
        tag: tag,
        level: viewStack.length,
        object: container
    };
    viewStack.push(viewStackObj);

    // animate the object coming onto the page
    $animate.enter(object, container);

    // since we added a new pane, let's make sure we're only showing at most the max number of elements on page (may not be important to you)
    adjust_columns($scope.config.getNumberActivePanes(), $scope.config.getColumnWidthClass());
};
```
This seems complex, but it's really not. I've tried to explain the majority of the functionality there. It's really just there to push the pane to the next level in the stack, making sure that it's fully compiled and linked with its own directive link function.

You'll notice I defined it on the 'control' object. This is so the controller can access and call the function later.

##### Let's Pop that Pane
At this point, popping a pane is super easy! Let's define that functionality.
```javascript
/**
 * pops the top pane off of the view stack,
 * removes from dom
 */
$scope.control.pop_pane = function()
{
    if(viewStack.length >= 1)
    {
        var pane = viewStack.pop(); // take it off the top!
        $animate.leave(pane.object); // animating it leaving also removes it entirely from the page
    }
};
```

##### I know, I know
I know. You're thinking "What if I need to pop a bunch of panes?" Or "What if I only need to pop panes up to a certain pane, but I only know the tag of the pane that should be at the top after I'm done popping?"

I know these things because I had those same concerns! So I wrote helper functions that leverage the pop_pane function.

```javascript
/**
 * begins popping panes from top of stack. stops after
 * popping the first occurrence (from the top) of the
 * given tag
 * @param {String} tag: tag at which to stop popping
 */
$scope.control.pop_panes_to_tag = function(tag)
{
    if(!$scope.control.check_for_tag(tag)) // another helper I made to make sure the tag was in the stack
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
```

That's most of the functionality that you need! Pushing and popping popups is pretty much the same as pushing and popping panes. I would just use a separate parent element for popups so they aren't mixed with panes.

(another great helper that I use a lot is a function to check if a certain pane is in the stack)

#### Using the Pane Switcher
Now let's use it! From my controller, I can simply call...
```javascript
var attrs = [
    { key: "id", value: "unique-id"}
];
$scope.paneSwitcherCtrl.push_pane('second-pane', attrs);
```
and your pane is on screen!

What if I want to remove the second pane if someone hits a button on the second-pane? Remeber the data object we created in the controller? Let's edit that to hook up that functionality.
```javascript
$scope.controlData = {
    object: object,
    "first-pane": {
        save: function(){}
    },
    "second-pane": {
        removeThyself: function() { $scope.paneSwitcherCtrl.pop_panes_to_tag('second-pane'); },
        back: function(){},
        save: function(){}
    }
}
```
Now, when someone hits the exit button on the second pane, we can call this from second-pane's link function:
```javascript
$scope.data[$scope.tag].removeThyself();
```
and it's gone!

The same principle can be applied to popups. Here's how I create a popup:
```javascript
var popup = {
    elementId: 'cool-popup',
    title: 'This is the title!',
    confirmButtonText: 'I Concur',
    cancelButtonText: 'Cancel',
    confirmButtonClass: 'css-class-for-confirm-button',
    cancelButtonClass: 'css-class-for-cancel-button',
    confirmButtonCallback: function(){ confirm(); },
    cancelButtonCallback: function(){ cancel(); }
}
$scope.paneSwitcherCtrl.push_popup('confirmation-popup', [], popup);
```
Here, I added another parameter to push_popup (compared to push_pane) because a popup doesn't need access to all the data from the controller that a pane does. It only needs to know what to display and the callbacks it needs to call, so this popup object becomes the directives new "data" scope property.

So the directive for confirmation-popup would have a template kind of like this:
```html
<div id="{{ data.elementId }}">
    <h1>{{ data.title }}</h1>
    <button ng-click="data.confirmButtonCallback()" class={{ data.confirmButtonClass }}>{{ confirmButtonText }}</button>
    <button ng-click="data.cancelButtonCallback()" class={{ data.cancelButtonClass }}>{{ cancelButtonText }}</button>
</div>
```

## Conclusion
If you're a victim of monolithic controllers and templates with angularjs where a lot of it isn't visible most of the time, there is hope. You can try cleaning everything up using an implementation similar to the pane-switcher. 

If you'd like more complete source code, checkout my example repo on [github]:https://github.com/grahamhz/pane-switcher

DISCLAIMER: If you're going to involve tracking state in the pane-switcher, might I suggest looking at the [ui-router]:https://github.com/angular-ui/ui-router
