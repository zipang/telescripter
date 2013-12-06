telescripter
============

a jQuery plugin to display text in telescript fashion..

## Usage

Drop jQuery and the jquery-telescripter scripts inside your page.

Target an element with come text content and transform it into a telescripter display :

```js
$(function() { // wait DOM Loaded

  $("#telescripter-demo").telescripter();
});

```
If the text content is not in your element, you can provide it as well :

```js
$(function() { // wait DOM Loaded

  $("#telescripter-demo").telescripter({
    source: [
      "Telescripter\nA jQuery plugin",  // first page of centent
      "Code source:\nhttp://github.com/zipang/telescripter" // second page
    ]
  });
});

```
You can tweak it as you want by providing even more options :
```js
$(function() { // wait DOM Loaded

  $("#telescriptrer-demo").telescripter({
    prompt: " #>",    // that'll be the default line prompt
    charDelay: 100,   // display a new character each 1/10sec
    lineDelay: 1000,  // wait 1sec between each line
    pageDelay: 5000,  // wait 5secs between each page display
    autostart: true,  // Automatically start the telescripter animation
    autoloop: true    // Automatically loop on the provided content
  });
})

```

## API

Once instanciated, the telescripter instance can be retrieved from the target elements it has been applied on :

```js
var telescripter = $("#telescripter-demo").data("telescripter");
```

You can now control the telescripter by invoking its public methods :

### stop()

### start()

### cls()

Display a new page

### displayRandomPage()

## Events

When the animation is playing, the telescripter warns you of its different phases by sending custom events to its container object.

### newPage

The `newPage` event is sent every time a new page is drawn.

### newLine

