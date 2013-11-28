/**
 * TeleScripter - a jQuery Plugin
 * @version 0.2.1
 * @date 2013-11-28
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

	// INTERNAL TOOLS

	/**
	 * Extract extended info from a line like prompt
	 * Example:
	 *   [$, red]I will begin with a red "$ " prompt
	 * @param line
	 * @return {Object} text and prompt of the line or false if no prompt info was detected
	 */
	function extractPrompt(line) {
		if (line[0] !== "[") return false; // no prompt info

		// that's a prompt specification
		var lineInfo = {},
			parts = line.split("]"),
			TEXT=0, COLOR=1, CLASS=2, // index of each parts
			prompt = parts[0].substr(1).split(",");

		lineInfo.prompt = [
			"<span ",
			prompt[COLOR] ? "style='color: " + prompt[COLOR] + ";' " : "",
			"class='prompt",
			prompt[CLASS] ? " " + prompt[CLASS] : "",
			"'>",
			prompt[TEXT],
			"</span>"
		].join("");
		lineInfo.text = parts[1];

		return lineInfo;
	}

	/**
	 * TelescriptMachine
	 * @constructor
	 */
	function TelescriptMachine(target, options) {
		this.$display = $(target);
		this.options  = options;

		if (!options.source) {
			options.source = this.$display.text();
		}

		if (options.autostart) {
			this.start();
		}
	};

	// Define the prototype methods
	$.extend(
		TelescriptMachine.prototype, {

			start : function() {

				var i = 0,
					machine = this.rendering ? this.stop() : this.init(),
					pages = machine.pages,
					len = machine.pages.length,
					printPages = function() {

						if (machine.rendering && i<len) {
							machine.printPage(pages[i], i, printPages);
							i++;
						} else {
							if (machine.rendering && machine.options.autoloop) {
								i = 0;
								requestAnimationFrame(printPages);
							}
						}
					};

				machine.rendering = true;
				printPages();
				return machine;
			},

			init : function() {
				var pages = this.options.source;

				if (typeof pages === "string") {
					pages = pages.split("\n\n"); // take each pages apart
				}

				this.pages = pages;
				return this;
			},

			cls : function(displayPrompt) {
				this.$renderElt = $("<div>");
				this.$display.empty().append(this.$renderElt);
				this.text = "";
				if (displayPrompt) this.refreshScreen(this.options.prompt);
				return this;
			},
			append : function(txt) {
				this.refreshScreen(this.text + txt);
				return this;
			},
			newline : function(prompt) {
				this.append("<br>" + (prompt || this.options.prompt));
				return this;
			},
			refreshScreen : function(text) {
				this.text = text;
				this.$renderElt.html(text);
				return this;
			},
			displayRandomPage : function(callback) {

				var machine = this.rendering ? this.stop() : this.init(),
					rnd = Math.floor(Math.random()*machine.pages.length);

				machine.rendering = true;
				machine.printPage(machine.pages[rnd], rnd, callback);
				return machine;
			},

			printPage : function(page, pageNumber, eop) {

				var i = 0, machine = this,
					lines = page.split("\n"),
					lineDelay = machine.options.lineDelay,
					len = lines.length,
					printLines = function() {

						if (machine.rendering) {
							if (i < len) {
								requestAnimationFrame(function() {
									var prompt = machine.options.prompt,
										newLine = lines[i],
										lineInfo  = extractPrompt(newLine);

									if (lineInfo) {
										newLine = lineInfo.text;
										prompt = lineInfo.prompt;
									}

									machine.newline(prompt);
									machine.rendering = setTimeout(function() {
										machine.printLine(newLine, i, printLines);
										i++
									}, lineDelay);
								});

							} else if (eop) {
								// Wait for the page transition delay
								// before calling callback
								machine.rendering = setTimeout(eop, machine.options.pageDelay);
							} else { // no callback
								machine.rendering = false;
							}
						}
					};

				machine.cls(); // clear screen
				machine.$renderElt.trigger("newpage", [pageNumber+1]);

				printLines();
				return machine;
			},

			printLine : function(line, lineNumber, eol) {

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
								machine.$renderElt.trigger("newline", [lineNumber+1]); // trigger the custom 'newline' event with the line number (1-based)
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

