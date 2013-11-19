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

				var i = 0, machine = this,
					pages = machine.options.source,
					len = pages.length,
					printPages = function() {

						if (machine.rendering) {
							machine.printPage(pages[i % len], printPages);
							i++;
						}
					};

				machine.rendering = true;
				printPages();
				return machine;
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

			printPage : function(message, eop) {
				this.cls();

				var i = 0, machine = this,
					lines = message.split("\n"),
					lineDelay = machine.options.lineDelay,
					len = lines.length,
					printLines = function() {

						if (machine.rendering) {
							if (i < len) {
								requestAnimationFrame(function() {
									if (i > 0) machine.newline();
									machine.rendering = setTimeout(function() {
										machine.printLine(lines[i++], printLines);
									}, lineDelay);
								});

							} else {
								// Wait for the page transition delay
								// before calling callback
								machine.rendering = setTimeout(eop, machine.options.pageDelay);
							}
						}
					};

				printLines();
				return machine;
			},

			printLine : function(line, eol) {

				var chars = line.split(""),
					machine = this,
					i = 0, len = chars.length,
					delay = machine.options.charDelay,
					printChars = function() {
						var prog = machine.rendering;
						requestAnimationFrame(function() {

							if (machine.rendering != prog) return;

							if (i < len) {
								machine.refreshScreen(machine.text + chars[i++]);
								machine.rendering = setTimeout(printChars, delay);
							} else {
								eol(); // end-of-line callback
							}
						});
					};

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

