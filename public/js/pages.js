/*global $, d3, CSSRule*/
'use strict';

$(document).ready(function () {

    $('.alert.selectable').on('click', function hideMessage(event) {
        $(this).fadeOut();
    });

    $('.question .continue').on('click', 'a', function handleContinuation(event) {
        var link = $(this),
            goto = link.closest('.continue'),
            substitute = goto.find('input[type=\'submit\']');
        if (goto.is('.disabled')) {
            event.preventDefault();
        } else if (link.is('.done') && substitute.size() > 0) {
            event.preventDefault();
            substitute.click();
        }
    });

    $('.question.multi-step').each(function init() {
        var goToPuzzle = function () {
            var steps = $('.puzzle'),
                cntSteps = steps.size(),
                hash = function determineStep() {
                    var hash = window.location.hash || '#';
                    return /step-[0-9]+/.test(hash) ? hash : hash + (hash.length > 1 ? '-' : '') + 'step-1';
                }(),
                goToStep = parseInt(/step-([0-9]+)/.exec(hash)[1], 10),
                visibleStep = steps.filter('.active'),
                clickedStep = steps.eq(goToStep - 1);
            visibleStep.fadeOut(function () {
                $(this).toggleClass('active inactive');
            });
            clickedStep.hide().toggleClass('active inactive').fadeIn().find('.progress-tracker').triggerHandler('change');
            $('.next').attr('href', hash.replace(/step-[0-9]+/, 'step-' + (goToStep === cntSteps ? 1 : goToStep + 1)));
        };
        window.onhashchange = goToPuzzle; // for IE reasons we cannot use $(window).bind('popstate', goToPuzzle);
        goToPuzzle();
    });

    // Q1
    $('.question-1').each(function init() {

        $(this).droppable({
            scope: 'items',
            drop: function (event, ui) {
                var price = $(ui.draggable),
                    product = price.closest('.product'),
                    zIndex = product.data('zIndex') || 0;
                product.data('zIndex', zIndex += 1);
                price.css({zIndex: zIndex}).removeClass('drag').find('input').prop('checked', false).triggerHandler('change');
            }
        });

        $('.product .caption').droppable({
            scope: 'items',
            hoverClass: 'indicator',
            tolerance: 'fit',
            greedy: true,
            drop: function (event, ui) {
                var price = $(ui.draggable),
                    product = price.closest('.product');
                price.removeClass('drag').siblings().has('input:checked').css({left: '', top: ''});
                price.find('input').prop('checked', true).triggerHandler('change');
            }
        });

        $('.price').draggable({
            revert: 'invalid',
            scope: 'items',
            containment: '.question-1',
            start: function (event, ui) {
                var card = $(this);
                card.addClass('drag').css({zIndex: 999});
            }
        }).find('input').change(function checkProgress() {
            var input = $(this),
                step = input.closest('.product'),
                steps = $('.product'),
                showContinueActual = $('.continue').not('.disabled'),
                showContinueNominal = step.find('input:checked').size() > 0,
                allDone = steps.find('input:checked').size() === steps.size();
            $('.done').toggleClass('hidden', !allDone);
            $('.next').toggleClass('hidden', allDone);
            if (showContinueActual !== showContinueNominal) {
                if (showContinueNominal) {
                    $('.continue').removeClass('hidden disabled').fadeIn();
                } else {
                    $('.continue').addClass('disabled').fadeOut(function () {
                        $(this).addClass('hidden');
                    });
                }
            }
        }).triggerHandler('change');

        $(window).resize(function repositionPriceInDropZone() {
            var fallback = $('.puzzle.active').find('.caption'),
                fallbackOffset = fallback.offset();
            fallbackOffset.left += Math.floor(fallback.width() * 0.33);
            fallbackOffset.top += Math.floor(fallback.height() * 0.4);
            $('.puzzle').each(function () {
                $(this).find('.price').each(function repostion() {
                    var price = $(this);
                    if (price.has('input:checked').size()) {
                        price.addClass('drag');
                        price.offset(fallbackOffset); // twice coz of css position-transition bug
                        price.offset(fallbackOffset);
                        price.removeClass('drag');
                    } else {
                        price.css({left: '', top: ''});
                    }
                });
            });
        }).resize();

    });

    // Q2
    $('.question-2').each(function init() {

        $('.choice input').change(function checkProgress() {
            var step = $(this).closest('.approach'),
                steps = $('.approach'),
                showContinueActual = $('.continue').not('.disabled'),
                showContinueNominal = step.find('input:checked').size() > 0,
                allDone = steps.find('input:checked').size() === steps.size();
            $('.done').toggleClass('hidden', !allDone);
            $('.next').toggleClass('hidden', allDone);
            if (showContinueActual !== showContinueNominal) {
                if (showContinueNominal) {
                    $('.continue').removeClass('hidden disabled').fadeIn();
                } else {
                    $('.continue').addClass('disabled').fadeOut(function () {
                        $(this).addClass('hidden');
                    });
                }
            }
        }).triggerHandler('change');

    });

    // Q3
    $('.question-3').each(function init() {

        var isInTransition = false; // flag indicating that an animation is taking place. prevent behaviour in this case

        function stampMouseover() {
            var id = '#' + d3.select(this).attr('id');
            d3.select(id + ' .bg').style('fill', '#fe6f48');
        }

        function stampMouseout() {
            d3.select('#yes .bg').style('fill', '#407fa2');
            d3.select('#no .bg').style('fill', '#407fa2');
        }

        function stamp(isOk) {
            var stampMark, stampMarkSVG,
                allDone;

            if (isInTransition) {
                return;
            }
            // drop the chosen stamp-marking
            // and proceed to the next sub-section
            isInTransition = true;

            if (isOk) {
                stampMark = $('.stamp-marking.yes');
                stampMarkSVG = d3.select('.stamp-marking.yes svg');
            } else {
                stampMark = $('.stamp-marking.no');
                stampMarkSVG = d3.select('.stamp-marking.no svg');
            }

            // get random position within the notepad where ths stamp mark will be made
            var left = stampMark.width() * 0.1 + (stampMark.width() * 0.4 * Math.random());
            var top = stampMark.height() * 0.02 + (stampMark.width() * 0.2 * Math.random());

            // set the position
            stampMarkSVG.style('left', left + 'px');
            stampMarkSVG.style('top', top + 'px');

            // hide all stamp-marks
            d3.selectAll('.stamp-marking svg')
                .style('opacity', '0');

            // set the form data
            $('.stampable.active input').eq(isOk).prop('checked', true).triggerHandler('change');

            function nextClick() {

                // hide all stamp-marks
                d3.selectAll('.stamp-marking svg')
                    .transition()
                    .duration(100)
                    .style('opacity', '0');

                d3.select('.continue')
                    .transition()
                    .duration(400)
                    .style('opacity', '0')
                    .each('end', function () {
                        d3.select('.continue').style('opacity', '1');
                        $('.continue').addClass('hidden');
                        $('a.done').addClass('hidden');
                        $('a.next').addClass('hidden');
                    });
            }

            // attach handlers to next button
            // in case the user clicks the arrow, reset the locked in selection
            $('a.next').on('click', nextClick);

            stampMarkSVG.transition()
                .duration(600)
                .ease('bounce')
                .style('height', '40%')
                .style('width', '40%')
                .style('opacity', '1')
                .each('end', function () {
                    isInTransition = false;

                    // check whether we're done
                    allDone = ($('.stampable.active').index() + 1) === $('.stampables .stampable').length;
                    if (allDone) {
                        $('.continue').removeClass('hidden');
                        $('a.done').removeClass('hidden');
                        $('a.next').addClass('hidden');

                    } else {

                        $('.continue').removeClass('hidden');
                        $('a.done').addClass('hidden');
                        $('a.next').removeClass('hidden');
                    }
                });
        }

        function attachInputChangeHandler() {
            $('.stampable input').change(function checkProgress() {

                // hide all stamp-marks
                d3.selectAll('.stamp-marking svg')
                    .style('opacity', '0');

                if ($(this).is(':checked')) {
                    if (this.value === String(1)) {
                        stamp(true);
                    } else {
                        stamp(false);
                    }
                }

                // workaround for the case that yes change will not trigger
                if ($(this).hasClass('no') && $(this).next().is(':checked')) {
                    stamp(true);
                }
            });

        }

        function loadStamps() {
            // load the svg
            $('.stamps').load('img/q3.stamps.svg', null, function () {

                // attach event handlers for ok stamp
                d3.select('.stamps #yes')
                    .on('mouseover', stampMouseover)
                    .on('mouseout', stampMouseout)
                    .on('click', function clickedy() {
                        $('.stampable.active input').eq(0).prop('checked', false).triggerHandler('change');
                        $('.stampable.active input').eq(1).prop('checked', true).triggerHandler('change');
                    });

                // attach event handlers for not ok stamp
                d3.select('.stamps #no')
                    .on('mouseover', stampMouseover)
                    .on('mouseout', stampMouseout)
                    .on('click', function clickedy() {
                        $('.stampable.active input').eq(0).prop('checked', true).triggerHandler('change');
                        $('.stampable.active input').eq(1).prop('checked', false).triggerHandler('change');
                    });

                // fix broken hover on touch devices
                $('#yes, #no').bind('click', function () {
                    stampMouseout();
                });

            });
        }

        // loads the checkmark / cross stamp-markings
        function loadYesNo() {
            $('.yesno .yes').load('img/q3.yes.svg', null, function () {
                // upon startup, check whether a radio is checked (might be the case when using the 'back' button, for example
                if ($('.stampable.active input.yes').is(':checked')){
                    setTimeout(function() {
                        stamp(true);
                    }, 500);
                }
            });

            $('.yesno .no').load('img/q3.no.svg', null, function () {
                // upon startup, check whether a radio is checked (might be the case when using the 'back' button, for example
                if ($('.stampable.active input.no').is(':checked')){
                    setTimeout(function() {
                        stamp(false);
                    }, 500);
                }
            });
        }

        loadStamps();
        loadYesNo();
        attachInputChangeHandler();

        // append resize listener
        $(window).resize(function () {
            $('.stampable input:checked').triggerHandler('change');
        });
    });

    // Q4
    $('.question-4').each(function init() {

        $(this).droppable({
            scope: 'items',
            drop: function (event, ui) {
                var card = $(ui.draggable);
                card.removeClass('drag').find('input').prop('checked', false).triggerHandler('change');
            }
        });

        $('.card').draggable({
            revert: 'invalid',
            scope: 'items',
            containment: '.question-4',
            start: function (event, ui) {
                var card = $(this),
                    piles = $('.answers'),
                    zIndex = piles.data('zIndex') + 1 || 1;
                piles.data('zIndex', zIndex);
                card.addClass('drag').css({ zIndex: zIndex });
            }
        }).find('input').change(function stack() {
            var input = $(this),
                card = input.closest('.card'),
                value = card.find('input:checked').val();
            if (typeof value === 'string') {
                var pile = $('.answer[data-value="' + value + '"]'),
                    pos = pile.offset();
                pos.left += Math.floor((pile.width() - card.width()) / 2),
                pos.top += Math.floor((pile.height() - card.height()) / 2);
                card.offset(pos); // twice coz of css position-transition bug
                card.offset(pos);
                card.removeClass('drag');
            }
            var steps = $('.card'),
                showContinueActual = $('.continue').not('.disabled'),
                showContinueNominal = steps.find('input:checked').size() === steps.size();
            if (showContinueActual !== showContinueNominal) {
                if (showContinueNominal) {
                    $('.continue').removeClass('hidden disabled').fadeIn();
                } else {
                    $('.continue').addClass('disabled').fadeOut(function () {
                        $(this).addClass('hidden');
                    });
                }
            }
        });

        $('.answer').droppable({
            scope: 'items',
            hoverClass: 'indicator',
            greedy: true,
            drop: function (event, ui) {
                var pile = $(this),
                    card = $(ui.draggable);
                card.removeClass('drag').find('input[value="' + pile.data('value') + '"]').prop('checked', true).triggerHandler('change');
            }
        });

        $(window).resize(function shuffleOrStack() {
            var table = $('.cards'),
                rangeX = table.width(),
                rangeY = table.height(),
                zIndex = 0;
            table.find('.card').each(function move() {
                var card = $(this),
                    cardZIndex = parseInt(card.css('zIndex'), 10),
                    input = card.find('input:checked');
                if (input.size()) {
                    card.addClass('drag').offset({ top: 0, left: 0 }).css({ zIndex: (cardZIndex || (zIndex += 1)) });
                    input.triggerHandler('change');
                } else {
                    card.css({top: Math.floor(Math.random() * rangeY), left: Math.floor(Math.random() * rangeX)});
                }
            });
            if (zIndex) {
                $('.answers').data('zIndex', zIndex);
            }
        }).resize();
    });

    // Q5
    $('.question-5').each(function init() {
        var thumbsupIsActive = false; // flags for thumbs up icon
        var thumbsupIsHover = false;

        function attachClick(index) {
            // attach click handlers to the individual bodies
            d3.select('.q5-svg.bodies g.body-' + index)
                .classed('selectable', true)
                .on('click', function () {
                    $('.continue').addClass('hidden');
                    createSpeechBubble(index);
                });
        }

        function loadBodies() {
            $('.q5-svg.bodies').append($('<div/>').addClass('frame'));
            $('.q5-svg.bodies .frame').load('img/q5.bodies.svg', null, function () {
                for (var i = 0; i < 5; i += 1) {
                    attachClick(i);
                }
            });
        }

        function loadSpeechBubbleCorners() {
            var container = $('.q5-svg.speech-bubble-corners');
            container.append($('<div/>').addClass('frame'));
            container = container.find('.frame');
            for (var i = 0; i < 5; i += 1) {
                container.append($('<div/>').load('img/q5.corner' + i + '.svg'));
            }
        }

        function resize() {
            // set the y position in relation to the bodies svg below
            var gutter = $('.q5-svg.speech-bubble-corners').height() * 0.64;

            d3.select('.q5-svg.speech-bubble .frame').style('bottom', gutter + 'px');
            var parentWidth = $('.q5-svg.bodies .frame').width();
            var frameWidth = parentWidth * 0.79;
            var left = (parentWidth - frameWidth) / 2;


            d3.select('.q5-svg.speech-bubble .frame')
                .style('width', frameWidth + 'px')
                .style('left', left + 'px');

            // hackish way to adjust the speech bubble outline thickness
            if ($('body').width() < 960) {
                d3.select('.q5-svg.speech-bubble .frame')
                    .style('border-width', 1 + 'px');
            } else {
                d3.select('.q5-svg.speech-bubble .frame')
                    .style('border-width', 3 + 'px');
            }
        }

        var currentBubbleIndex;

        function createSpeechBubble(index) {

            // only proceed if the current is not the one being clikedy-clicked
            if (currentBubbleIndex === index) {

                // hide thumbs up
                d3.select('.q5-svg.thumbs-up svg')
                    .transition().duration(200).style('opacity', 0);

                //hide speech bubble
                d3.select('.q5-svg.bubbles')
                    .transition()
                    .duration(500)
                    .style('opacity', 0);

                //show context
                d3.select('.context')
                    .transition()
                    .duration(500)
                    .style('opacity', 1);

                currentBubbleIndex = -1;

            } else {
                // remove active & hover state of thumbs-up
                d3.selectAll('.turns-red').transition().duration(200).style('fill', '#FFFFFF');
                d3.select('.q5-svg.thumbs-up .inner-frame .hover').transition().duration(200).style('opacity', 0);

                //show context
                d3.select('.context')
                    .transition()
                    .duration(500)
                    .style('opacity', 0.2);

                // remove old bubble
                d3.select('.q5-svg.bubbles').transition().duration(500).style('opacity', 0)
                    .each('end', function () {
                        d3.select('.q5-svg.speech-bubble').html('');

                        // show thumbs up
                        d3.select('.q5-svg.thumbs-up svg').transition().duration(200).style('opacity', 1);
                        thumbsupIsHover = false;
                        thumbsupIsActive = false;

                        // hide current
                        d3.selectAll('.q5-svg.speech-bubble-corners .corner').style('opacity', 0);

                        // show one corner
                        d3.select('.q5-svg.speech-bubble-corners .corner-' + index).style('opacity', 1);

                        var textContent = $('#q5a_' + (index + 1) + ' .text').html();

                        d3.select('.q5-svg.speech-bubble')
                            .append('div')
                            .attr('class', 'frame')
                            .append('div')
                            .attr('class', 'speech-bubble-text note emphasis invert')
                            .html(textContent)
                        ;
                        d3.select('.q5-svg.bubbles').transition().duration(500).style('opacity', 1);

                        resize();

                        currentBubbleIndex = index;

                    });
            }

            // append resize listener
            $(window).resize(function () {
                resize();
            });
        }

        function loadThumbsUp() {
            $('.thumbs-up').load('img/q5.thumbsUp.svg', null, function () {
                // attach event handlers
                d3.select('.thumbs-up')
                    .classed('selectable', true)
                    .on('click', function () {
                        thumbsupIsActive = !thumbsupIsActive;

                        if (thumbsupIsActive) {
                            d3.selectAll('.turns-red').transition().duration(200).style('fill', '#fe6f48');
                            $('.continue').removeClass('hidden');

                            // set the form data
                            $('.advice input').prop('checked', false).triggerHandler('change');
                            $('.advice input#advice-' + (currentBubbleIndex + 1)).prop('checked', true).triggerHandler('change');

                        } else {
                            d3.selectAll('.turns-red').transition().duration(200).style('fill', '#FFFFFF');
                            $('.continue').addClass('hidden');
                        }

                    });
                d3.select('.thumbs-up').on('mouseover', function () {
                    if (!thumbsupIsHover) {
                        d3.select('.thumbs-up .hover').transition().duration(200).style('opacity', 1);
                    }
                    thumbsupIsHover = true;

                });
                d3.select('.thumbs-up').on('mouseout', function () {
                    thumbsupIsHover = false;
                    if (!thumbsupIsActive) {
                        d3.select('.thumbs-up .hover').transition().duration(200).style('opacity', 0);
                    }
                });
            });
        }

        loadSpeechBubbleCorners();
        loadBodies();
        loadThumbsUp();
    });

    // Q6
    $('.question-6').each(function init() {
        // flag preventing multiple 'next' clicks
        var nextEnabled = true;
        var hasBeenReset = false;

        // maximum  minimum rotation angle
        var MAX_ROTATION_ANGLE = 77.4;
        var MIN_ROTATION_ANGLE = -79.9;

        var arrowIsResetting = false; // flag to prevent user input during arrow (bouncy) reset

        // locks an answer (prevent light going out and arrow movement)
        var answerIsLocked = false;

        var drag, // d3 drag behaviour
            arrowPath,  // the arrow svg
            arrowFrame,  // the arrow svg
            deltaDrag = {x: 0, y: 0}, // drag distances
            translation, angle; // d3 scales for the lights

        var answerChosen = false; // flag indicating that the arrow has been rotated so far that an answer has been chosen

        /**
         * calculates the angle for the arrow rotation based on the mouse-drag
         * @param x  horizontal drag
         * @param y  vertical drag
         * @returns {number} the rotation angle (in degrees)
         */
        function calculateRotationAngle(x, y) {
            var dx = x - ($('#q6-arrow').width() / 2);
            var dy = $('#q6-arrow').height() * 0.9 - y;

            if (dy < 0) {
                dy = 0;
            }

            var angle = Math.atan2(dy, dx) - (Math.PI / 2);
            angle *= -57.2957795; //convert from rad to deg

            // constrain rotation
            if (angle < MIN_ROTATION_ANGLE) {
                angle = MIN_ROTATION_ANGLE;
            }
            if (angle > MAX_ROTATION_ANGLE) {
                angle = MAX_ROTATION_ANGLE;
            }
            return angle;
        }

        /**
         * calculates the offsets for the svg graphics
         * @returns {{x: number, y: number}}
         */
        function calculateOffsets() {
            var frameOriginalWidth = parseFloat(d3.select('#q6-arrow svg').attr('width').replace('px', ''), 10);
            var frameOriginalHeight = parseFloat(d3.select('#q6-arrow svg').attr('height').replace('px', ''), 10);
            return {
                x: frameOriginalWidth / 2,
                y: frameOriginalHeight * 0.9
            };
        }

        /**
         * called after the user clicks the arrow or drags it back from a locked in position
         * puts the arrow back to the starting position
         */
        function reset() {
            // only reset if not locked
            if (answerIsLocked) {
                return;
            }

            arrowIsResetting = true;
            hasBeenReset = true;
            nextEnabled = true;

            // remove the next link
            $('.continue').addClass('hidden').fadeOut();
            $('a.next').addClass('hidden').fadeOut();

            // reset the lights
            d3.selectAll('.light-6')
                .transition()
                .duration(400)
                .attr('r', d3.select('.light-5').attr('r'));

            // reset the path
            arrowPath.transition()
                .duration(800)
                .ease('bounce')
                .attrTween('transform', tweenToNeutral)
                .each('end', function () {
                    deltaDrag.x = 0;
                    deltaDrag.y = 0;
                    angle = 0;
                    arrowIsResetting = false;
                });

            // reset the true false labels
            $('.question-6 .true').removeClass('highlight');
            $('.question-6 .false').removeClass('highlight');
        }

        // higlights the chosen term
        function highlight(trueOrFalse) {
            $('.question-6 .' + trueOrFalse)
                .addClass('highlight');
        }

        // higlights the chosen term
        function unhighlight(trueOrFalse) {
            $('.question-6 .' + trueOrFalse)
                .removeClass('highlight');
        }

        // drag callback function for the arrow
        function unlock() {
            answerIsLocked = false;
            d3.selectAll('.light-6')
                .transition()
                .duration(400)
                .attr('r', d3.select('.light-5').attr('r'));
            // reset the true false labels
            $('.question-6 .true').removeClass('highlight');
            $('.question-6 .false').removeClass('highlight');

        }

        function dragMove() {
            var trueOrFalse, // flag for setting the respnse to either true or false
                allDone; // flag indicating that the last question has been reached

            // prevent user input while the arrow is swinging back to the neutral position
            // not doing so causes glitches
            if (arrowIsResetting) {
                return;
            }
            // reset the input
            $('.statement.active input').prop('checked', false).triggerHandler('change');

            // unlock the answer, ie reset to not answered
            // this handles the behaviour that the user has locked in an answer but then decides differently and unlocks
            unlock();

            // calculate the trigonometric parameters necessary for rotating the arrow
            translation = calculateOffsets();

            d3.select('.centroid')
                .style('left', translation.x + 'px')
                .style('top', translation.y + 'px');

            angle = calculateRotationAngle(d3.event.x, d3.event.y);

            arrowPath.attr('transform', 'rotate(' + angle + ',' + translation.x + ', ' + translation.y + ')');

            // in case the arrow has been rotated all the way to the right, highlight the last light and the 'true' label
            if (angle >= (MAX_ROTATION_ANGLE)) {
                answerChosen = true;
                d3.select('.light-true.light-6')
                    .transition()
                    .duration(200)
                    .attr('r', 80)
                    .style('fill', '#ffffff');
                highlight('true');

            }

            // in case the arrow has been rotated all the way to the left, highlight the last light and the 'false' label
            if (angle <= (MIN_ROTATION_ANGLE)) {
                answerChosen = true;
                d3.select('.light-false.light-6')
                    .transition()
                    .duration(200)
                    .attr('r', 80);
                highlight('false');
            }

            // handle lock in behaviour
            // set the radio buttons and show the correct buttons (next/done)
            if ((angle <= MIN_ROTATION_ANGLE || angle >= MAX_ROTATION_ANGLE) && nextEnabled) {
                answerIsLocked = true;

                trueOrFalse = angle >= MAX_ROTATION_ANGLE;
                $('.statement.active input').eq(trueOrFalse).prop('checked', true).triggerHandler('change');

                $('.continue').removeClass('hidden');
                allDone = ($('.statement.active').index() + 1) === $('.statements .statement').length;
                $('a.done').toggleClass('hidden', !allDone);
                $('a.next').toggleClass('hidden', allDone);
            }
        }

        // in case the user clicks the arrow, reset the locked in selection
        $('a.next').on('click', function () {
            unlock();
            reset();
        });

        // helper functions for d3 arrow rotation tween
        function tweenToNeutral() {
            return d3.interpolateString('rotate(' + angle + ',' + translation.x + ',' + translation.x + ')', 'rotate(' + 0 + ',' + translation.x + ', ' + translation.x + ')');
        }

        function tweenToFalse() {
            return  d3.interpolateString('rotate(' + angle + ',' + translation.x + ',' + translation.x + ')', 'rotate(' + MIN_ROTATION_ANGLE + ',' + translation.x + ', ' + translation.x + ')');
        }

        function tweenToTrue() {
            return d3.interpolateString('rotate(' + angle + ',' + translation.x + ',' + translation.x + ')', 'rotate(' + MAX_ROTATION_ANGLE + ',' + translation.x + ', ' + translation.x + ')');
        }

        // d3 drag behaviour
        drag = d3.behavior.drag();
        drag.on('drag', dragMove);
        drag.on('dragend', reset);

        var attachDialCallbacks = function (element) {
            element.call(drag);
            element.on('click', function () {
                // reset the input
                $('.statement.active input').prop('checked', false).triggerHandler('change');
                unlock();
                reset();
            });
        };

        // attach click handler on the labels
        var attachLabelCallbacks = function (trueOrFalse) {

            var label = d3.select('.true-false .' + trueOrFalse + ' span');
            label.on('click', function () {
                // select the element
                $('.statement.active input').eq(trueOrFalse).prop('checked', true).triggerHandler('change');
                $('.statement.active input').eq(!trueOrFalse).prop('checked', false).triggerHandler('change');
            });
        };

        function attachInputChangeHandler() {
            $('.statement input').change(function checkProgress() {
                    if ($(this).is(':checked')) {
                        unlock();
                        // setup angle and tween depending on true or false
                        var tween, newAngle, selector, negateSelector;

                        if (this.value === String(1)) {
                            tween = tweenToTrue;
                            newAngle = MAX_ROTATION_ANGLE;
                            selector = 'true';
                            negateSelector = 'false';
                        } else {
                            tween = tweenToFalse;
                            newAngle = MIN_ROTATION_ANGLE;
                            selector = 'false';
                            negateSelector = 'true';
                        }

                        // transition the arrow
                        arrowPath.transition()
                            .duration(800)
                            .ease('bounce')
                            .attrTween('transform', tween)
                            .each('end', function () {
                                angle = newAngle;
                            });

                        // animate light
                        d3.select('.light-' + selector + '.light-6')
                            .transition()
                            .duration(800)
                            .attr('r', 80)
                            .style('fill', '#ffffff');

                        // highlight the label
                        highlight(selector);
                        unhighlight(negateSelector);

                        // set locked
                        answerChosen = true;
                        answerIsLocked = true;

                        $('.continue').removeClass('hidden');
                        var allDone = ($('.statement.active').index() + 1) === $('.statements .statement').length;
                        $('a.done').toggleClass('hidden', !allDone);
                        $('a.next').toggleClass('hidden', allDone);
                    }
                }
            );
        }


        // attaches all necessary callbacks to the svg elements
        // called after the svg elements have completed loading
        var attachCallbacks = function () {

            // attach callbacks to arrow as well a the dial, so that it does not matter where the user drags
            attachDialCallbacks(arrowPath);
            attachDialCallbacks(d3.select('#q6-arrow svg'));

            // reset the dial display
            angle = 0;
            translation = calculateOffsets();

            attachLabelCallbacks(false);
            attachLabelCallbacks(true);

            attachInputChangeHandler();
        };

        // load all svgs
        $('.question-6 .dial').load('img/q6.dial.svg', null, function () {
            $('.question-6 .arrow').load('img/q6.arrow.svg', null, function () {
                arrowPath = d3.select('.arrow path');
                arrowFrame = d3.select('.arrow svg');
                $('.question-6 .cap').load('img/q6.cap.svg', null, function () {
                    $('.question-6 .lights').load('img/q6.lights.svg', null, function () {
                        //make the very first and the very last light white
                        d3.selectAll('.light-6').style('fill', '#ffffff');
                        // all svg elements finished loading. attach callbacks
                        calculateOffsets();
                        attachCallbacks();
                    });
                });
            });
        });
    });

    // Q7
    $('.question-7').each(function init() {

        var TRASH_WIDTH_HEIGHT_RATIO = 302.013 / 352.814;

        var trashIndex = 0,// the index of the trashcan sprite (0 == empty, 4 == full_)
            trashed = [false, false, false, false, false],// the index of the trashcan sprite (0 == empty, 4 == full_)
            drag; // d3 drag behaviour

        // hash holding all notes
        // used so that the notes can be reordered
        // index 0 is always the big note in the centre
        var notesList = {};

        // the center points of the focused note and the trash can.
        // used for calculating the distances between the two and thus which image to show (note or crumpled)
        var centroidFocus, centroidTrash, boundingBoxTrash;

        var overDropTarget = false; // flag indicating that the focused note is over the trash

        var crumpleScale = d3.scale.linear();
        crumpleScale.rangeRound([0, 2]).clamp();

        var allDone = false; // fag indicating that all but one note have been discarded

        // d3 drag behaviour
        drag = d3.behavior.drag();

        function isOverTrash(point) {
            var b0 = (point.x >= boundingBoxTrash.x0),
                b1 = (point.x <= boundingBoxTrash.x1),
                b2 = (point.y >= boundingBoxTrash.y0),
                b3 = (point.y <= boundingBoxTrash.y1);
            return b0 && b1 && b2 && b3;
        }

        drag.on('drag', function () {
            var dragedId = parseInt(this.id.replace('postit-frame-', ''), 10);
            if (dragedId === notesList[0]) {


                var currLeft = parseInt($(this).css('left').replace('px', ''), 10);
                var currTop = parseInt($(this).css('top').replace('px', ''), 10);

                var currWidth = $(this).width();
                var currHeight = $(this).height();

                var newLeft = currLeft + d3.event.dx;
                var newTop = currTop + d3.event.dy;

                if (newLeft < -currWidth / 2) {
                    newLeft = -currWidth / 2;
                }
                if (newLeft > $('body').width() - currWidth / 2) {
                    newLeft = $('body').width() - currWidth / 2;
                }

                if (newTop < -currHeight / 2) {
                    newTop = -currHeight / 2;
                }
                if (newTop > $('body').height() - currHeight / 2) {
                    newTop = $('body').height() - currHeight / 2;
                }

                d3.select(this)
                    .style('top', newTop + 'px')
                    .style('left', newLeft + 'px');

                centroidFocus = {
                    x: newLeft + currWidth / 2,
                    y: newTop + currHeight / 2
                };

                var xdS = Math.pow((centroidTrash.x - centroidFocus.x ), 2);
                var ydS = Math.pow((centroidTrash.y - centroidFocus.y ), 2);
                var distanceToTrash = Math.sqrt(xdS + ydS);

                var spriteIndex = crumpleScale(distanceToTrash);
                spriteIndex = Math.max(spriteIndex, 0);
                d3.select(this).classed('crumpled-1', spriteIndex === 1);
                d3.select(this).classed('crumpled-2', spriteIndex > 1);

                if (isOverTrash(centroidFocus) && trashIndex < 4) {
                    d3.selectAll('.trash svg .change-color').style('fill', '#fe6f48');
                    overDropTarget = true;

                } else if (trashIndex >= 4) {
                    d3.selectAll('.trash svg .change-color').style('fill', '#407fa2');
                    overDropTarget = false;
                    layoutFrames();

                } else {
                    d3.selectAll('.trash svg .change-color').style('fill', '#407fa2');
                    overDropTarget = false;
                }

            }
        });

        drag.on('dragend', function () {

            d3.selectAll('.trash svg .change-color').style('fill', '#407fa2');

            if (overDropTarget) {

                // hide the current active note
                $('#postit-frame-' + notesList[0]).remove();

                // change the trash image
                trashIndex += 1;

                // show one additional paper in trash can
                d3.select('.trash svg #paper-' + trashIndex).style('opacity', '1');

                // reset drop target flag
                overDropTarget = false;

                trashed[notesList[0] - 1] = true;

                allDone = trashIndex === ($('.postit').length - 1);

                if (allDone) {
                    // set the form data
                    $('.postit input').prop('checked', false).triggerHandler('change');
                    $('.postit input#list-' + (notesList[0])).prop('checked', true).triggerHandler('change');

                    $('.continue').hide();
                    $('.continue').removeClass('hidden');
                    $('.continue').fadeIn();
                    $('.trash').fadeOut();
                }

                // move all items in the notes list one place to the left
                for (var i = 0; i < numLists - 1; i += 1) {
                    notesList[i] = notesList[i + 1];
                }
                notesList[numLists - 1] = -1;

            } else {
                d3.select(this).classed('crumpled-1', false);
                d3.select(this).classed('crumpled-2', false);
            }

            layoutFrames();

        });

        // load all
        var numLists = $('.postit').length;

        function layoutFrames(clickedIndex) {

            // layout variables
            var fontSize = parseInt($('html').css('font-size').replace('px', ''), 10),

                totalWidth = $('#svg-frame').width(),
                totalHeight = $('#svg-frame').height(),
                marginRight = totalWidth * 0.05,

                focusWidth = fontSize * 25,
                focusHeight = focusWidth,
                focusLeft = (totalWidth - focusWidth) / 2,
                focusTop = totalHeight * 0.3,

                trashTop = totalHeight * 0.5,
                trashHeight = totalHeight * 0.25,
                trashWidth = trashHeight / TRASH_WIDTH_HEIGHT_RATIO
                ;

            if (focusHeight + focusTop > totalHeight) {
                focusTop = fontSize * 3;
            }

            // layout trash can
            d3.selectAll('.trash')
                .style('right', marginRight + 'px')
                .style('top', trashTop + 'px')
                .style('width', trashWidth + 'px')
                .style('height', trashHeight + 'px');

            var thumbIndex = 0;
            var transitionDuration = 750;

            var x, y, initial = !notesList[0];
            for (var i = 0; i < numLists; i += 1) {
                var l = initial ? i + 1 : i;

                // there might be deleted notes. skip if encountering one of them
                if (typeof $('#postit-frame-' + notesList[l])[0] === 'undefined') {
                    continue;
                }

                if (l === 0) {
                    d3.select('#postit-frame-' + notesList[l])
                        .classed('selectable', false)
                        .style('z-index', '')
                        .transition()
                        .duration(transitionDuration)
                        .style('top', focusTop + 'px')
                        .style('left', focusLeft + 'px')
                        .each('end', function () {
                            d3.select(this).classed('draggable', true);
                        });

                } else if (!clickedIndex || clickedIndex !== notesList[l]) {
                    x = thumbIndex % 2 ? -50 : 10;
                    y = Math.floor(fontSize * 22 * 0.33 * thumbIndex - 50);
                    d3.select('#postit-frame-' + notesList[l])
                        .classed('selectable', true)
                        .classed('draggable', false)
                        .style('z-index', thumbIndex += 1)
                        .transition()
                        .duration(transitionDuration)
                        .style('left', x + 'px')
                        .style('top', y + 'px');

                }
            }

            // store the distance between the active note and the trash can
            centroidFocus = {
                x: focusLeft + focusWidth / 2,
                y: focusTop + focusHeight / 2
            };

            boundingBoxTrash = {
                x0: totalWidth - marginRight - trashWidth,
                y0: trashTop,
                x1: totalWidth - marginRight,
                y1: trashTop + trashHeight
            };

            centroidTrash = {
                x: (totalWidth - marginRight) - (trashWidth / 2),
                y: trashTop + trashHeight / 2
            };

            var xdS = Math.pow((centroidTrash.x - centroidFocus.x ), 2);
            var ydS = Math.pow((centroidTrash.y - centroidFocus.y ), 2);
            var distanceToTrash = Math.sqrt(xdS + ydS);

            crumpleScale.domain([distanceToTrash, distanceToTrash / 3]);
        }

        function selectNote(clickedIndex) {
            if (!notesList[0]) {
                // initialize
                d3.select('.context')
                    .transition()
                    .duration(500)
                    .style('opacity', 0.2);
                for (var i in notesList) {
                    if (notesList.hasOwnProperty(i)) {
                        var noteIndex = notesList[i];
                        if (noteIndex === clickedIndex) {
                            notesList[0] = noteIndex;
                        } else if (noteIndex > clickedIndex) {
                            notesList[i - 1] = notesList[i];
                        }
                    }
                }
                layoutFrames();
            } else if (clickedIndex !== notesList[0]) {
                // swap the current and the clicked notes in the notes list
                for (var i in notesList) {
                    if (notesList.hasOwnProperty(i)) {
                        var noteIndex = notesList[i];
                        if (noteIndex === clickedIndex) {
                            notesList[i] = notesList[0];
                            notesList[0] = noteIndex;
                            break;
                        }
                    }
                }
                layoutFrames(clickedIndex);
            }
        }

        // check whether the others are done as well
        function attachCallbacks() {
            d3.selectAll('.postit-frame').call(drag);

            $('.postit-frame').on('click', function () {
                    var clickedId = parseInt(this.id.replace('postit-frame-', ''), 10);
                    selectNote(clickedId);
                });
            $('.postit-frame').on({ 'touchstart': function () {
                    var clickedId = parseInt(this.id.replace('postit-frame-', ''), 10);
                    selectNote(clickedId);
                }});
        }

        // helper for loading the trash cans (filled with crumpled papers)
        function loadTrashCan() {
            $('.trash').load('img/q7.basket.svg', null, function () {
                d3.selectAll('.trash svg .paper').style('opacity', '0');
                d3.select('.trash svg #paper').style('opacity', '1');
            });
        }

        // START HERE!
        loadTrashCan();
        for (var i = 1; i <= numLists; i += 1) {
            notesList[i] = i;
        }
        layoutFrames();
        attachCallbacks();

        // append resize listener
        $(window).resize(function () {
            layoutFrames();
        });
    });

    // Q8
    $('.question-8').each(function init() {

        var pie, arc, pieSvg, pieGroup, pieLeft, pieTop, pieWidth, pieHeight, pieRadius, piePath,
            optionsFrame, // the div containing the options text
            knobDrag,// drag event handler for knob
            knobPosition, knobAngle,
            optionsScale = d3.scale.linear().domain([1, 6]).range([0, Math.PI * 2]),
            reverseOptionsScale = d3.scale.linear().domain([2 * Math.PI, 0]).range([1, 6]),
            pieRingOriginalOuterDimensions = { width: 760, height: 760 },
            barSvg, barGroup, barWidth, barHeight, barXScale, barYScale, bars, barLabels, barPercenteges,
            color = d3.scale.ordinal().range(['#c3c75c', '#97d4d2', '#e8e5d5', '#ff8a6c', '#848484']),
            data = [[30,25,20,15,10],[23,40,17,12,8],[18,33,10,25,14],[12,8,35,25,20],[23,12,22,18,25]],
            dataSelector = 'option0',
            dataPerSelector = {},
            optionIndex = 1,
            previousOptionIndex = 1;

        // helper function returning the centorid of the bar chart. called during layout()
        function centroid() {
            var x = $('.pie-chart').width() / 2;
            var y = $('.pie-chart').height() / 2;
            return {
                x: x,
                y: y
            };
        }

        // layout knob
        function layoutKnob() {
            var knob = d3.select('.pie-chart .knob');
            knob.style('width', 42 + 'px');
            knob.style('height', 43 + 'px');

            knobPosition = {
                left: centroid().x - ( pieRadius * Math.sin(knobAngle) ) - (pieRadius / 8),
                top: centroid().y - ( pieRadius * Math.cos(knobAngle) ) - (pieRadius / 8)
            };

            knob.style('left', knobPosition.left + 'px');
            knob.style('top', knobPosition.top + 'px');
        }

        function snapKnobHome() {
            knobAngle = -1 * optionsScale(optionIndex);
            layoutKnob();
        }

        // helper function re-layouting the elements after init / window-resize
        function layout() {
            var option, top, left, labelWidth, labelHeight;


            function layoutOptionLabels() {
                for (var o = 1; o <= 5; o += 1) {
                    option = d3.select('#svg-frame .option-' + o);
                    top = centroid().y;
                    left = centroid().x;

                    top -= (1.3 * pieRadius * Math.cos(optionsScale(o)));
                    left += (1.3 * pieRadius * Math.sin(optionsScale(o)));

                    labelWidth = $('#svg-frame .option-' + o).width();
                    labelHeight = $('#svg-frame .option-' + o).height();

                    left -= labelWidth / 2;
                    top -= labelHeight / 2;

                    option.style('top', top + 'px');
                    option.style('left', left + 'px');
                    if (optionIndex === o) {
                        $(option[0]).addClass('active');
                    }
                }
            }


            function layoutBarChart() {
                barWidth = $('#svg-frame').find('.bar-chart').width();
                barHeight = $('#svg-frame').find('.bar-chart').height();
                barXScale.range([0, barWidth]);
                barYScale.rangeRoundBands([0, barHeight * 0.7], 0.2);
                barSvg.attr('width', barWidth).attr('height', barHeight);
                barGroup.attr('transform', 'translate(' + (barWidth * 0.1) + ', 20)');
                var fontSize = parseInt($('.label').css('font-size').replace('px', ''), 10);
                barLabels
                    .attr('x', function (d, i) {
                        return barXScale(d.value) + 10;
                    })
                    .attr('y', function (d, i) {
                        return barYScale(i) + (fontSize * 1.05);
                    });

                barPercenteges
                    .attr('x', 10)
                    .attr('y', function (d, i) {
                        return barYScale(i) + (fontSize * 1.05);
                    });
                bars
                    .attr('x', function (d) {
                        return barXScale(Math.min(0, d.value));
                    })
                    .attr('y', function (d, i) {
                        return barYScale(i);
                    })
                    .attr('width', function (d) {
                        return Math.abs(barXScale(d.value));
                    })
                    .attr('height', barYScale.rangeBand());
            }

            function layoutPieChart() {

                // calculate position and dimensions
                pieWidth = $('#svg-frame').width() / 2;
                pieHeight = $('#svg-frame').height() / 2;
                pieWidth = Math.min(pieWidth, pieHeight) * 0.67;
                pieHeight = pieWidth;
                pieRadius = pieWidth / 2;
                pieLeft = $('.context').offset().left + $('.context').width() / 2 - pieWidth / 2;
                pieTop = $('#svg-frame').height() * 0.48;

                // layout frame
                d3.select('#svg-frame .pie-chart').style({
                    width: pieWidth + 'px',
                    height: pieWidth + 'px',
                    left: pieLeft + 'px',
                    top: pieTop + 'px'
                });

                // set the size and position of the pie chart svg
                pieSvg.attr('width', pieWidth).attr('height', pieHeight);

                // move the pie chart slices to the centre
                pieGroup.attr('transform', 'translate(' + pieRadius + ',' + pieRadius + ')');

                // this rescales the pie chart itself. the duration is 0, so no animation takes place
                piePath.transition().duration(0).attrTween('d', function (a) {
                    var i = d3.interpolate(this._current, a),
                        k = d3.interpolate(arc.outerRadius()(), pieRadius);
                    this._current = i(0);
                    return function (t) {
                        return arc.innerRadius(0).outerRadius(k(t))(i(t));
                    };
                });

                // set the size and position of the pie chart ring
                var pieRing = d3.selectAll('#svg-frame .pie-chart .ring svg g');
                var scaleFactor = 1.01 * pieRadius / pieRingOriginalOuterDimensions.width;
                var pieRingXOffset = (pieWidth / 2) - (scaleFactor * pieRingOriginalOuterDimensions.width);
                pieRing.attr('transform', 'translate(' + pieRingXOffset + ', 1) scale(' + (2 * scaleFactor) + ') ');
            }

            layoutPieChart();
            layoutBarChart();

            layoutOptionLabels();

            knobAngle = optionsScale(optionIndex);
            layoutKnob();
        }

        // prepare data
        function loadData() {
            for (var o = 0; o < data.length; o += 1) {
                var key = 'option' + o;
                dataPerSelector[key] = [];
                for (var i = 0; i < data[o].length; i += 1) {
                    dataPerSelector[key].push({value:data[o][i]});
                }
            }
        }

        function createBarChart() {
            barWidth = $('#svg-frame').find('.bar-chart').width();
            barHeight = $('#svg-frame').find('.bar-chart').height();

            barXScale = d3.scale.linear()
                .domain([0, 100]);

            barYScale = d3.scale.ordinal()
                .domain([0, 1, 2, 3, 4])
                .rangeRoundBands([0, barHeight * 0.8], 0.2);

            barSvg = d3.select('#svg-frame .bar-chart')
                .append('svg');

            barGroup = barSvg.append('g');

            bars = barGroup.selectAll('.bar')
                .data(dataPerSelector[dataSelector])
                .enter().append('rect')
                .attr('class', function (d, i) {
                    return 'bar';
                })
                .style('fill', function (d, i) {
                    return color(i);
                })
                .attr('width', function (d) {
                    return Math.abs(barXScale(d.value));
                })
                .attr('height', barYScale.rangeBand());


            barLabels = barGroup.selectAll('.label')
                .data(dataPerSelector[dataSelector])
                .enter().append('text')
                .attr('class', 'label emphasis invert note')
                .text(function (d, index) {
                    return $('#share-text-' + (index + 1) + ' span').text().toUpperCase();
                });

            barPercenteges = barGroup.selectAll('.percentages')
                .data(dataPerSelector[dataSelector])
                .enter().append('text')
                .attr('class', 'label emphasis invert note')
                .text(function (d) {
                    return d.value + '%';
                });
        }

        // helper function for tweening the pie chart.
        // Store the displayed angles in _current.
        // Then, interpolate from _current to the new angles.
        // During the transition, _current is updated in-place by d3.interpolate.
        function arcTween(a) {
            var i = d3.interpolate(this._current, a);
            this._current = i(0);
            return function (t) {
                return arc(i(t));
            };
        }

        // helper function to append the options links around the pie chart
        function appendOptionLink(index) {
            optionsFrame.append('div')
                .attr('class', 'option caption emphasis invert selectable option-' + index)
                .on('click', function handleOptionClick() {
                    dataSelector = 'option' + (index - 1);
                    optionIndex = index;
                    pie.value(function (d) {
                        return d.value;
                    }); // change the value function

                    piePath = piePath.data(pie(dataPerSelector[dataSelector])); // compute the new angles
                    piePath.transition().duration(750).attrTween('d', arcTween); // redraw the arcs

                    bars.data(dataPerSelector[dataSelector])
                        .transition().duration(750)
                        .attr('width', function (d) {
                            return Math.abs(barXScale(d.value));
                        });

                    barLabels.data(dataPerSelector[dataSelector])
                        .transition().duration(750)
                        .attr('x', function (d, i) {
                            return barXScale(d.value) + 10;
                        });

                    barPercenteges.data(dataPerSelector[dataSelector])
                        .transition().duration(750)
                        .text(function (d) {
                            return d.value + '%';
                        });

                    // visual hints
                    $('#svg-frame .option').removeClass('active');
                    $('#svg-frame .option-' + optionIndex).addClass('active');

                    snapKnobHome();


                })
                .text(index);
        }

        function createPieChart() {

            pieWidth = $('#svg-frame').width() / 2;
            pieHeight = $('#svg-frame').height() / 2;

            pieWidth = Math.min(pieWidth, pieHeight) * 0.6;
            pieHeight = pieWidth;

            pieRadius = pieWidth / 2;

            pieLeft = $('.context').offset().left + $('.context').width() / 2 - pieWidth / 2;
            pieTop = $('#svg-frame').height() * 0.35;

            pie = d3.layout.pie()
                .sort(null)
                .value(function (d) {
                    return d.value;
                });

            arc = d3.svg.arc()
                .innerRadius(0)
                .outerRadius(pieRadius);

            pieSvg = d3.select('#svg-frame .pie-chart')
                .append('svg');

            pieGroup = pieSvg.append('g');

            piePath = pieGroup.selectAll('path')
                .data(pie(dataPerSelector[dataSelector]))
                .enter().append('path')
                .attr('fill', function (d, i) {
                    return color(i);
                })
                .attr('d', arc)
                .each(function (d, i) {
                    this._current = d;
                }); // store the initial angles


            // load the frame
            $('#svg-frame .pie-chart').append($('<div/>').addClass('ring'));
            $('#svg-frame .pie-chart .ring').load('img/q8.ring.svg', null, function () {
                var ring = d3.select('#svg-frame .pie-chart .ring');
                layout();
            });

            $('#svg-frame .pie-chart').append($('<div/>').addClass('knob'));
            $('#svg-frame .pie-chart .knob').load('img/q8.knob.svg', null, function () {
                var knob = d3.select('#svg-frame .pie-chart .knob');
                knob.classed('draggable', true);

                layout();

                knobDrag = d3.behavior.drag();

                // layout option labels
                var dragOffset;


                knobDrag.on('dragstart', function () {
                    dragOffset = {
                        x: 0,
                        y: 0
                    };
                });

                // knob drag behaviour

                knobDrag.on('drag', function () {

                    var delta = {
                        x: d3.event.x - centroid().x,
                        y: centroid().y - d3.event.y
                    };
                    var angle = Math.atan2(delta.y, delta.x);

                    angle -= Math.PI / 2;

                    knobAngle = angle;
                    layoutKnob();

                    angle -= Math.PI / 8;
                    angle += (Math.PI * 2);
                    angle %= (Math.PI * 2);

                    // check which label is active

                    optionIndex = Math.floor(reverseOptionsScale(angle));

                    if (optionIndex !== previousOptionIndex) {
                        dataSelector = 'option' + (optionIndex - 1);
                        previousOptionIndex = optionIndex;

                        pie.value(function (d) {
                            return d.value;
                        }); // change the value function

                        piePath = piePath.data(pie(dataPerSelector[dataSelector])); // compute the new angles
                        piePath.transition().duration(750).attrTween('d', arcTween); // redraw the arcs

                        bars.data(dataPerSelector[dataSelector])
                            .transition().duration(750)
                            .attr('width', function (d) {
                                return Math.abs(barXScale(d.value));
                            });

                        barLabels.data(dataPerSelector[dataSelector])
                            .transition().duration(750)
                            .attr('x', function (d, i) {
                                return barXScale(d.value) + 10;
                            });

                        barPercenteges.data(dataPerSelector[dataSelector])
                            .transition().duration(750)
                            .text(function (d) {
                                return d.value + '%';
                            });

                        $('#svg-frame .option').removeClass('active');
                        $('#svg-frame .option-' + optionIndex).addClass('active');

                    }

                });


                knobDrag.on('dragend', function () {
                    snapKnobHome();
                });


                knob.call(knobDrag);
            });

            // create the options
            optionsFrame = d3.select('#svg-frame .options');
            for (var o = 1; o <= 5; o += 1) {
                appendOptionLink(o);
            }

        } // END createPieChart

        // before submitting the form, set the correct value for the input
        function attachDoneCallback() {
            $('.continue a').click(function () {
                // set the form data
                $('.share input').prop('checked', false).triggerHandler('change');
                $('.share input#share-' + (optionIndex)).prop('checked', true).triggerHandler('change');
            });
        }

        // START HERE!
        loadData();
        createBarChart();
        createPieChart();
        attachDoneCallback();

        // append resize listener
        $(window).resize(function () {
            layout();
        });
    });

    // splash screen for result preparation
    $('.calculation').each(function init() {
        $('.banner').click(function (event) {
            if ($(this).is('.working')) {
                event.preventDefault();
            }
        }).toggleClass('working inactive').append($('<b/>').addClass('percentage').css({width: 0})).find('.text').hide();
        $('.percentage').animate({'width': '100%'}, 1800, 'linear', function () {
            $(this).remove();
            $('.banner').removeClass('working').find('.text').fadeIn();
        });

    });

    $('.result').each(function init() {

        $('.comparison').find('.label').each(function calculate() {
            var vis, pie, arc, arcs,
                proportion = parseInt($(this).text(), 10),
                data = [
                    {'value': proportion},
                    {'value': 100 - proportion}
                ];
            vis = d3.select('.chart').append('svg:svg').data([data]).attr('width', '100%').attr('height', '100%').attr('viewBox', '0 0 50 50').append('svg:g').attr('transform', 'translate(25, 25)');
            arc = d3.svg.arc().outerRadius(20);
            pie = d3.layout.pie().value(function (d) {
                return d.value;
            });
            arcs = vis.selectAll('g.slice').data(pie).enter().append('svg:g').attr('class', 'slice');
            arcs.append('svg:path').attr('transform',function (d, i) {
                return i === 0 ? 'rotate(90) scale(1.15, 1.15)' : 'rotate(90)';
            }).attr('fill',function (d, i) {
                return i === 0 ? '#fe6f48' : '#407fa2';
            }).attr('d', arc);
        });

    });

});