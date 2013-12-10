/**
 * TeleScripter - a jQuery Plugin
 * @version 0.3.0
 * @date 2013-12-09
 * @author zipang
 * @url http://github.com/zipang/telescripter
 * @licence MIT
 */
(function(w, $) {

	var DEFAULTS = {
		autostart: true,
		autoloop: true,
		cursor: true,
		prompt: "> ",
		pageDelay: 2500, // time between pages display
		lineDelay: 500,  // time between paragraphs display
		charDelay: 150   // time between individuals characters printing
	};

	// CONST
	var CURSOR_OPEN = "<span class=\"cursor\">",
		CURSOR_CLOSE = "</span>";

	// INTERNAL TOOLS

	/**
	 * Extract prompt definition from a line if there is one
	 * Example:
	 *   [$, red]I will begin with a red "$ " prompt
	 * Full syntax:
	 *   <[prompt, color, className]><line>
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
				return this.refreshScreen(this.text + txt);
			},
			newline : function(prompt) {
				this.append("<br>" + (prompt || this.options.prompt));
				return this;
			},
			refreshScreen : function(text) {
				var machine = this,
					renderedText = machine.text = text,
					len = text.length;

				if (machine.options.cursor) { // wrap the last character inside a cursor
					renderedText = text.substr(0, len-1) + CURSOR_OPEN + text[len-1] + CURSOR_CLOSE;
				}

				machine.$renderElt.html(renderedText);
				return machine;
			},
			displayRandomPage : function(callback) {

				var rnd = Math.floor(Math.random()*this.pages.length);

				return this.displayPage(rnd, callback);
			},
			displayPage : function(pageNumber, callback) {

				var machine = this.rendering ? this.stop() : this.init();

				machine.rendering = true;
				machine.printPage(machine.pages[pageNumber], pageNumber, callback);
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
								requestAnimationFrame(machine.resume = function() {
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
					i = 0, len = chars.push(" "),
					delay = machine.options.charDelay,
					printChars = function() {
						var prog = machine.rendering;
						requestAnimationFrame(machine.resume = function() {

							if (machine.rendering === false) return;

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
			},

			pauseResume: function() {
				var machine = this;
				if (machine.rendering) {
					return machine.stop();
				} else {
					machine.rendering = true;
					return machine.resume();
				}
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

