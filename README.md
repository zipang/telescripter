telescripter
============

a jQuery plugin to display text in telescript fashion..

## Usage

Drop jQuery and the jquery-telescripter scripts inside your page.

Target an element with come text content and transform it into a telescripter display :

```js
$(function() { // wait DOM Loaded

  $("#telescriptrer-demo").telescripter();
})

```
You can add some options to spice
```js
$(function() { // wait DOM Loaded

  $("#telescriptrer-demo").telescripter({
    prompt: " #>",    // that'll be the default line prompt
    charDelay: 100,   // display a new character each 1/10sec
    lineDelay: 1000,  // wait 1sec between each line
    pageDelay: 5000   // wait 5secs between each page display
  });
})

```

## API

Once instanciated, the telescripter instance can be retrieved from the target elements it has been applied on :

```js
var telescripter = $("#telescriptrer-demo").data("telescripter");
```
