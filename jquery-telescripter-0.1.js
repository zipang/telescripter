/**
 * TeleScripter - a jQuery Plugin
 * @version 0.1
 * @date 2013-11-17
 * @author zipang
 * @url http://github.com/zipang/telescripter
 * @licence MIT
 */
(function(w, $) {

	var DEFAULTS = {
		autostart: true,
		autoloop: true,
		prompt: "> ",
		pageDelay: 2500, // time between pages display
		lineDelay: 500,  // time between paragraphs display
		charDelay: 150   // time between individuals characters printing
	};

	/**
	 * TelescriptMachine
	 * @constructor
	 */
	function TelescriptMachine(target, options) {
		this.$display = $(target);
		this.options  = options;

		var text = this.$display.text();

		if (text && !options.source) {
			options.source = text.split("\n\n");
		}

		if (options.autostart) {
			this.start();
		}
	};

	// Define the prototype methods
	$.extend(
		TelescriptMachine.prototype, {

			start : function() {

				if (this.rendering) this.stop().cls();

				var source = this.options.source;

				var i = 0, machine = this,
					len = source.length,
					printParaphs = function() {

						if (machine.rendering) {
							machine.displayPage(source[i % len], printParaphs);
							i++;
						}
					};

				this.rendering = true;
				printParaphs();
				return this;
			},

			cls : function() {
				this.$renderElt = $("<pre>");
				this.$display.empty().append(this.$renderElt);
				this.refreshScreen(this.options.prompt);
				return this;
			},
			append : function(txt) {
				this.refreshScreen(this.text + txt);
				return this;
			},
			newline : function() {
				this.append("\n" + this.options.prompt);
				return this;
			},
			refreshScreen : function(text) {
				this.text = text;
				this.$renderElt.text(text);
				return this;
			},

			displayPage : function(message, callback) {
				this.cls();

				var i = 0, machine = this,
					lines = this.lines = message.split("\n"),
					lineDelay = machine.options.lineDelay,
					len = lines.length,
					printLines = function() {

						if (machine.rendering && i < len) {
							requestAnimationFrame(function() {
								if (i > 0) machine.newline();
								machine.rendering = setTimeout(function() {
									machine.printLine(lines[i++], printLines);
								}, lineDelay);
							});

						} else {
							// Wait for the page transition delay before calling callback
							machine.rendering = setTimeout(callback, machine.options.pageDelay);
						}
					};

				this.rendering = true;
				printLines();
				return this;
			},

			printLine : function(newLine, callback) {

				var chars = newLine.split(""),
					machine = this,
					i = 0, len = chars.length,
					delay = machine.options.charDelay,
					printChars = function() {
						requestAnimationFrame(function() {

							if (machine.rendering && i < len) {
								machine.refreshScreen(machine.text + chars[i++]);
								machine.rendering = setTimeout(printChars, delay);
							} else {
								callback();
							}
						});
					};

				this.rendering = true;
				printChars();
			},
			stop: function() {
				clearTimeout(this.rendering);
				this.rendering = false;
				return this;
			}

		}
	);

	$.fn.telescripter = function (options) {

		return $(this).each(function(i, elt) {
			// Initialize
			var opt = $.extend({}, DEFAULTS, options),
			    telescripter = new TelescriptMachine(elt, opt);

			$(elt).data("telescripter", telescripter)
				.on("start", function() {
					telescripter.start();
				})
				.on("stop", function() {
					telescripter.stop();
				});
		});
	};
})(this, jQuery);

