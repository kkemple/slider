/**
 * Slider
 * Author: Kurtis Kemple
 * Email: kurtiskemple@gmail.com
 * Desc: A simple content slider with fade or slide transitions, lightweight and has a few options
 */

;(function( $, window, document, undefined ) {
	'use strict';

	var Slider = function( opts ) {
		this.methods.init.call( this, opts );
		return this;
	};

	Slider.prototype = {

		methods: {
			init: function( opts ) {
				//create default settings
				this.defaults = {
					contentElement: '',
					duration: 5000, // 5 seconds
					speed: 600,
					transition: 'slide',
					reverse: false,
					auto: true,
					startIndex: 1,
					showButtons: false,
					showArrows: false,
					leftArrowNavClass: '',
					rightArrowNavClass: '',
					dotNavClass: '',
					initialized: function() {},
					buildComplete: function() {},
					beforeSlide: function() {},
					afterSlide: function() {},
					itemsAppended: function() {},
					itemsRemoved: function() {},
					paused: function() {},
					reset: function() {},
					resumed: function() {},
					updated: function() {}
				};

				//extend the default settings with end use settings
				this.options = $.extend( {}, this.defaults, opts || {} );

				//cache the el and wrap in jquery
				this.element = $( this.options.contentElement )
					.css( 'overflow', 'hidden' );

				//make sure we have an element for the slider to be created on
				if ( this.element.length < 1 ) {
					this.methods.error( 'You must set the contentElement property in the options: Slider' );
				}

				//cache our slides for easy access later
				this.slides = $( this.element.children() );

				// check to see if the element has position set,
				// if not add it so we can contain elements like the nav buttons
				if ( this.element.css( 'position' ) !== 'fixed' ||
					 this.element.css( 'position' ) !== 'absolute' ||
					 this.element.css( 'position' ) !== 'relative' ) {
						this.element.css( 'position', 'relative' );
				}

				//init our timer id, this will be used to control our interval functions
				this.timer = 0;

				//init our resize timer id, this will be used to fire a done resizing flag
				this.resizetimer = 0;

				//init our no slides flag
				this.hasSlides = false;

				if ( this.slides.length > 1 ) {
					this.hasSlides = true;
				}

				//init our busy flag
				this.animating = false;

				//init our current slide
				this.current = 1;

				//init our paused flag
				this.paused = false;

				//init our resizing flag
				this.resizing = false;

				this.options.initialized.call( this );

				if ( this.hasSlides ) {
					//depending on which transition is going to be used, build for that transition
					if ( this.options.transition.toLowerCase() === 'slide' ) {
						this.methods.buildSlide.call( this );
					} else {
						this.methods.buildFade.call( this );
					}
				} else {
					this.methods.error( 'Too few slides to animate, Slider()' );
				}
			},

			buildSlide: function() {

				//create the sliding container for our slider
				this.container = $( '<div/>', {
						'class': 'mod-slider-container'
					})
					.css( 'overflow', 'hidden' )
					.appendTo( this.element );

				//add our slides to it
				$( this.slides )
					.appendTo( this.container )
					.css( 'float', 'left' );

				/*
				 * set initial dimensions
				 * create the clones we need for faux infinite looping
				 * set our initial left postion, based on the start index option
				 * call our events method
				 * start our slider if auto option is enabled
				 * call our initialized call back
				 */
				this.methods.updateSlideDimensions.call( this );
				this.methods.sizeContainer.call( this );
				this.methods.sizeSlides.call( this );
				this.methods.updateSlideDimensions.call( this );
				this.methods.sizeContainer.call( this );
				this.methods.sizeSlides.call( this );
				this.methods.createClones.call( this );
				this.methods.setInitLeftPos.call( this );
				this.methods.events.call( this );
				if ( this.options.showButtons ) {
					this.methods.buildButtonNav.call( this );
				}
				if ( this.options.showArrows ) {
					this.methods.buildArrowNav.call( this );
				}
				if ( this.options.auto ) {
					this.methods.start.call( this );
				}
				this.options.buildComplete.call( this );
			},

			buildFade: function() {
				this.container = $( '<div/>', {
						'class': 'mod-slider-container'
					})
					.css( 'overflow', 'hidden' )
					.appendTo( this.element );

				//prep our slides for fade transitions
				$( this.slides )
					.appendTo( this.container )
					.css( 'position', 'absolute' )
					.css( 'left', 0 )
					.css( 'top', 0 )
					.hide()
					.first()
					.addClass( 'active' );

				//set our start slide and show it
				if ( this.options.startIndex > 1 ) {
					this.active = this.slides.eq( this.options.startIndex - 1 ).show();
					this.current = this.options.startIndex;
				} else {
					this.active = this.slides.first().show();
				}

				/*
				 * set our dimensions and size everything accordingly
				 * call our events method
				 * start our slider if auto option is enabled
				 * call our initialized function
				 */
				this.methods.updateFadeDimensions.call( this );
				this.methods.sizeContentElement.call( this );
				this.methods.events.call( this );
				if ( this.options.showButtons ) {
					this.methods.buildButtonNav.call( this );
				}
				if ( this.options.showArrows ) {
					this.methods.buildArrowNav.call( this );
				}
				if ( this.options.auto ) {
					this.methods.start.call( this );
				}
				this.options.buildComplete.call( this );
			},

			buildButtonNav: function() {
				if ( this.navContainer ) {
					this.navContainer.remove();
				}
				var self = this;
				this.navButtons = [];
				this.navContainer = $( '<ul/>', {
					'class': 'mod-slider-nav-container'
				}).css({
					'position': 'absolute'
				}).appendTo( this.element );

				$.each( this.slides, function( index ) {
					self.navButtons[ index ] = $( '<li>', {
						'class': 'mod-slider-nav-button ' + self.options.dotNavClass
					}).appendTo( self.navContainer );

					self.navButtons[ index ].on( 'click', function() {
						if( !self.paused ) {
							self.index( index + 1 );
							$.each( self.navButtons, function() {
								$( this ).removeClass( 'active' );
							});
							self.navButtons[ index ].addClass( 'active' );
						}
					});
				});

				this.navButtons[ 0 ].addClass( 'active' );
				this.methods.setButtonNavDimensions.call( this );
			},

			setButtonNavDimensions: function() {
				var width = this.element[0].clientWidth;
				var navWidth = this.navContainer[0].clientWidth;
				this.navContainer.css({
					'left': ( ( width - navWidth ) / 2 ) + 'px'
				});
			},

			buildArrowNav: function() {
				var self = this;

				this.leftArrowNav = $( '<a/>', {
					'class': 'mod-slider-left-arrow ' + this.options.leftArrowNavClass,
					'href': '#'
				}).appendTo( this.element );

				this.rightArrowNav = $( '<a/>', {
					'class': 'mod-slider-right-arrow ' + this.options.rightArrowNavClass,
					'href': '#'
				}).appendTo( this.element );

				this.leftArrowNav.on( 'click', function( e ) {
					self.prev();
					e.preventDefault();
				});

				this.rightArrowNav.on( 'click', function( e ) {
					self.next();
					e.preventDefault();
				});
			},

			events: function() {
				var self = this;
				$( window ).resize(function() {
					self.resizing = true;
					self.methods.resize.call( self );
				});
				$( window ).smartresize(function() {
					self.methods.resize.call( self );
					self.resizing = false;
				});
			},

			clearTimer: function() {
				window.clearInterval( this.timer );
			},

			start: function() {
				var self = this;
				this.methods.clearTimer.call( this );
				switch ( this.options.reverse ) {
					case false:
						this.timer = window.setInterval(function() {
							self.next();
						}, self.options.duration );
					break;
					case true:
						this.timer = window.setInterval(function() {
							self.prev();
						}, self.options.duration );
					break;
				}
			},

			transitionSlide: function( index ) {
				this.methods.clearTimer.call( this );
				this.options.beforeSlide.call( this );

				var self = this;
				this.animating = true;
				this.container
					.animate({
						'margin-left': -( ( index || this.current ) * this._width )
					}, self.options.speed, function() {
						self.current = index || self.current;
						self.animating = false;
						self.methods.refresh.call( self );
						if ( self.options.showButtons ) {
							$.each( self.navButtons, function() {
									$( this ).removeClass( 'active' );
								});
							self.navButtons[ self.current - 1 ].addClass( 'active' );
						}
						self.methods.setLeftPos.call( self );
						self.options.afterSlide.call( self );
					});

				if( this.options.auto )
					this.methods.start.call( this );
			},

			transitionFade: function( index ) {
				this.methods.clearTimer.call( this );
				this.options.beforeSlide.call( this );

				var self = this;
				var slide = this.active;
				var newSlide;

				if ( typeof index === 'string' || typeof index === 'String' ) {
					switch ( index ) {
						case 'prev':
							newSlide = this.active.prev();
							if ( newSlide.length === 0 ) {
								newSlide = $( this.slides.last() );
							}
						break;
						case 'next':
							newSlide = this.active.next();
							if ( newSlide.length === 0 ) {
								newSlide = $( this.slides.first() );
							}
						break;
					}
				} else {
					newSlide = $( this.slides.eq( index - 1 ) );
					this.current = index;
				}

				this.animating = true;

				this.active
					.fadeOut( this.options.speed )
					.removeClass( 'active' );

				newSlide.fadeIn( this.options.speed, function() {
					self.animating = false;
					self.options.afterSlide.call( self );
				}).addClass( 'active' );

				this.active = newSlide;
				this.methods.refresh.call( this );
				if ( self.options.showButtons ) {
					$.each( self.navButtons, function() {
							$( this ).removeClass( 'active' );
						});
					self.navButtons[ self.current - 1 ].addClass( 'active' );
				}

				if( this.options.auto )
					this.methods.start.call( this );
			},

			refresh: function() {
				if ( this.current >= this.slides.length + 1 ) {
					this.current = 1;
				} else if ( this.current <= 0 ) {
					this.current = this.slides.length;
				}
			},

			createClones: function() {
				this.clones = [];
				this.clones.push(
					this.slides.last().clone(), this.slides.first().clone()
				);

				this.clones[0]
					.addClass( 'clone' )
					.prependTo( this.container );

				this.clones[1]
					.addClass( 'clone' )
					.appendTo( this.container );
			},

			updateSlideDimensions: function() {
				this._height = this.slides[this.current - 1].clientHeight;
				this._width = parseInt( this.element[0].clientWidth, 10 );

				this.containerWidth = this._width * ( this.slides.length + 2 );
			},

			updateFadeDimensions: function() {
				this._height = this.active.height();
			},

			sizeContainer: function() {
				this.container
					.width( this.containerWidth )
					.height( this._height );
			},

			sizeSlides: function() {
				this.slides
					.width( this._width );
			},

			sizeClones: function() {
				var self = this;
				$.each( this.clones, function() {
					$( this ).width( self._width );
				});
			},

			sizeContentElement: function() {
				this.element
					.height( this._height );
			},

			setInitLeftPos: function() {
				this.container.css( 'margin-left', -( this._width * this.options.startIndex ) );
				if ( this.options.startIndex > 1 ) {
					this.current = this.options.startIndex;
				}
			},

			setLeftPos: function() {
				this.container.css( 'margin-left', -( this._width * this.current ) );
			},

			resize: function() {
				if ( !this.animating ) {
					switch ( this.options.transition.toLowerCase() ) {
						case 'slide':
							this.methods.updateSlideDimensions.call( this );
							this.methods.sizeSlides.call( this );
							this.methods.sizeClones.call( this );
							this.methods.sizeContainer.call( this );
							this.methods.sizeContentElement.call( this );
							this.methods.setLeftPos.call( this );
							if ( this.options.showButtons ) {
								this.methods.setButtonNavDimensions.call( this );
							}
						break;
						case 'fade':
							this.methods.updateFadeDimensions.call( this );
							this.methods.sizeContentElement.call( this );
							if ( this.options.showButtons ) {
								this.methods.setButtonNavDimensions.call( this );
							}
						break;
					}
				} else {
					var self = this;
					window.setTimeout(function() {
						self.methods.resize.call( self );
					}, 1);
				}
			},

			appendSlideItems: function( slides ) {
				this.pause.call( this );
				slides.css( 'float', 'left' );
				this.slides = this.slides.add( slides );
				slides.insertBefore( this.container.children().last() );
				this.container.children().first().remove();
				this.container.prepend( slides
					.last()
					.clone()
					.addClass( 'clone' )
					.css( 'float', 'left' )
				);
				this.clones.pop();
				this.clones.push( this.container.children().first() );
				this.methods.updateSlideDimensions.call( this );
				this.methods.sizeClones.call( this );
				this.methods.sizeSlides.call( this );
				this.methods.sizeContainer.call( this );
				this.methods.setLeftPos.call( this );
				if ( this.options.showButtons ) {
					this.methods.buildButtonNav.call( this );
				}
				this.resume.call( this );
				this.options.itemsAppended.call( this );
			},

			appendFadeItems: function( slides ) {
				this.pause.call( this );
				this.slides = this.slides.add( slides );
				slides
					.css( 'position', 'absolute' )
					.css( 'left', 0 )
					.css( 'top', 0 )
					.removeClass( 'active' )
					.hide()
					.appendTo( this.container );
				if ( this.options.showButtons ) {
					this.methods.buildButtonNav.call( this );
				}
				this.resume.call( this );
				this.options.itemsAppended.call( this );
			},

			removeSlideItems: function( start, num ) {
				if ( num > this.slides.length - 2 ) {
					this.methods.error( 'Can not remove that amount of slides, two slides must exist for slider to function properly: Slider()' );
				}

				this.pause.call( this );
				this.slides.splice( start, num );
				this.methods.refresh.call( this );

				$.each( this.container.children(), function() {
					var self = $( this );
					if ( self.hasClass( 'clone' ) ) {
						self.remove();
					}
				});

				var i = 0,
					s = start,
					n = num;
				for ( ; i < n ; ) {
					this.container
						.children()
						.eq( s - 1 )
						.remove();
					i++;
				}

				this.methods.createClones.call( this );
				this.methods.updateSlideDimensions.call( this );
				this.methods.sizeContainer.call( this );
				this.methods.setLeftPos.call( this );
				if ( this.options.showButtons ) {
					this.methods.buildButtonNav.call( this );
				}
				this.reset.call( this );
				this.options.itemsRemoved.call( this );
			},

			removeFadeItems: function( start, num ) {
				if ( num > this.slides.length - 2 ) {
					this.methods.error( 'Can not remove that amount of slides, two slides must exist for slider to function properly: Slider()' );
				}

				this.pause.call( this );
				this.slides.splice( start, num );
				this.methods.refresh.call( this );

				var i = 0,
					s = start,
					n = num;
				for ( ; i < n ; ) {
					this.element
						.children()
						.eq( s )
						.remove();
					i++;
				}
				if ( this.options.showButtons ) {
					this.methods.buildButtonNav.call( this );
				}
				this.active = this.element.children().first().show();
				this.resume.call( this );
			},

			error: function( msg ) {
				throw new Error( msg );
			}
		},

		next: function() {
			if ( !this.paused ) {
				if( !this.resizing ) {
					if ( !this.animating ) {
						if ( this.options.transition.toLowerCase() === 'slide' ) {
							this.current++;
							this.methods.transitionSlide.call( this );
						} else {
							this.current++;
							this.methods.transitionFade.call( this, 'next' );
						}
					}
				}
			}
		},

		prev: function() {
			if ( !this.paused ) {
				if( !this.resizing ) {
					if ( !this.animating ) {
						if ( this.options.transition.toLowerCase() === 'slide' ) {
							this.current--;
							this.methods.transitionSlide.call( this );
						} else {
							this.current--;
							this.methods.transitionFade.call( this, 'prev' );
						}
					}
				}
			}
		},

		index: function( index ) {
			if ( !this.paused ) {
				if( !this.resizing ) {
					if ( !this.animating ) {
						this.animating = true;
						if ( index > this.slides.length ) {
							this.methods.error( 'Can not slide to index: ' + index + ', not enough slides. Slider()' );
							this.animating = false;
						} else if ( index < 1 ) {
							this.methods.error( 'Can not slide to index: ' + index + ', start index is 1. Slider()' );
							this.animating = false;
						}

						if ( this.options.transition.toLowerCase() === 'slide' ) {
							this.methods.transitionSlide.call( this, index );
						} else {
							this.methods.transitionFade.call( this, index );
						}
					}
				}
			}
		},

		resume: function() {
			if ( this.paused ) {
				this.paused = false;
				this.next.call( this );
				if ( this.options.auto ) {
					this.methods.start.call( this );
					this.options.resumed.call( this );
				}
			}
		},

		reset: function() {
			if ( this.paused )
				this.paused = false;

			this.index( 1 );
			if ( this.options.auto ) {
				this.methods.start.call( this );
			}
			this.options.reset.call( this );
		},

		pause: function() {
			this.paused = true;
			this.methods.clearTimer.call( this );
			this.options.paused.call( this );
		},

		update: function( opts ) {
			this.pause.call( this );
			this.options.duration = opts.duration || this.options.duration,
			this.options.speed = opts.speed || this.options.speed,
			this.options.reverse = opts.reverse || this.options.reverse,
			this.options.auto = opts.auto || this.options.auto,
			this.options.startIndex = opts.startIndex || this.options.startIndex,
			//this.options.initialized = opts.initialized || this.options.initialized,
			this.options.beforeSlide = opts.beforeSlide || this.options.beforeSlide,
			this.options.afterSlide = opts.afterSlide || this.options.afterSlide,
			this.options.itemsAppended = opts.itemsAppended || this.options.itemsAppended,
			this.options.itemsRemoved = opts.itemsRemoved || this.options.itemsRemoved,
			this.options.paused = opts.paused || this.options.paused,
			this.options.reset = opts.reset || this.options.reset,
			this.options.resumed = opts.resumed || this.options.resumed,
			this.options.updated = opts.updated || this.options.updated;
			this.options.updated.call( this );
			if ( this.options.auto ) {
				this.resume.call( this );
			}
		},

		append: function( slides ) {
			switch ( this.options.transition.toLowerCase() ) {
				case 'slide':
					this.methods.appendSlideItems.call( this, slides );
				break;
				case 'fade':
					this.methods.appendFadeItems.call( this, slides );
			}
		},

		remove: function( start, num ) {
			switch ( this.options.transition.toLowerCase() ) {
				case 'slide':
					this.methods.removeSlideItems.call( this, start, num );
				break;
				case 'fade':
					this.methods.removeFadeItems.call( this, start, num );
			}
		}
	};

	//This function stops the browser from firing multiple on resize events and executes code
	//once the resizing stops
	(function( $, sr ){

		// debouncing function from John Hann
		// http://unscriptable.com/index.php/2009/03/20/debouncing-javascript-methods/
		var debounce = function ( func, threshold, execAsap ) {
			var timeout;

			return function debounced () {
				var obj = this, args = arguments;
				function delayed () {
					if ( !execAsap )
						func.apply( obj, args );
					timeout = null;
				}

				if ( timeout )
					clearTimeout( timeout );
				else if ( execAsap )
					func.apply( obj, args );

				timeout = setTimeout( delayed, threshold || 100 );
				};
			};
		// smartresize
		jQuery.fn[sr] = function( fn ){ return fn ? this.bind('resize', debounce( fn ) ) : this.trigger( sr ); };

	})( jQuery, 'smartresize' );

	//attach the slider var to the window object
	window.Slider = Slider;
})( jQuery, this, this.document );