/**
 * TeleScripter - a jQuery Plugin
 * @version 0.3.1
 * @date 2013-12-15
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
		pageDelay: 2500,  // time between pages display
		lineDelay: 500,   // time between paragraphs display
		charDelay: 150,   // time between individuals characters printing
		charEvents: false // send events on each char ?
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
		this.$renderElt = $(target);
		this.options  = options;

		if (!options.source) {
			options.source = this.$renderElt.text();
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

						if (machine.rendering === false) return;

						if ( i < len ) {
							machine.printPage(pages[i], i, printPages);
							i++;
						} else if (machine.options.autoloop) {
							i = 0;
							requestAnimationFrame(printPages);
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

			cls : function() {
				return this.prompt(this.text = "");
			},
			append : function(txt) {
				return this.refreshScreen(this.text + txt);
			},
			prompt : function(prompt, lf) {
				return this.append(
					(lf ? "<br>" : "") 
						+ (prompt ? 
							"<span class=\"prompt\">" + prompt + "</span>"
							: "")
				);
			},
			refreshScreen : function(text) {
				var machine = this,
					renderedText = machine.text = text,
					lastPos, lastChar;

				if (machine.options.cursor) { // wrap the last character inside a cursor
					lastChar = text[lastPos = text.length - 1];
					if (lastChar && lastChar !== ">") {
						renderedText = text.substr(0, lastPos) + CURSOR_OPEN + lastChar + CURSOR_CLOSE;	
					} else {
						renderedText += (CURSOR_OPEN + "&nbsp;" + CURSOR_CLOSE);
					}					
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

									machine.prompt(prompt, i > 0);
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
					char, i = 0, len = chars.push(" "),
					$renderElt = machine.$renderElt,
					delay = machine.options.charDelay,
					nextChar = machine.options.charEvents 
						? function() { 
							$renderElt.trigger("newChar", char = chars[i++]);
							return char; 
						} : function() { return chars[i++]; },
					printChars = function() {
						requestAnimationFrame(machine.resume = function() {

							if (machine.rendering === false) return;

							if (i < len) {
								machine.refreshScreen(machine.text + nextChar());
								machine.rendering = setTimeout(printChars, delay);
							} else {
								$renderElt.trigger("newline", [lineNumber+1]); // trigger the custom 'newline' event with the line number (1-based)
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

