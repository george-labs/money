/*global $*/
'use strict';

var timeoutHandler = function(data, status) {
    if (status === 'error') {
        var response = typeof data === 'object' ? JSON.stringify(data) : data;
        if (!response || response.indexOf('Not authorized') !== -1) {
            window.location.href = '/login/timeout';
        } else {
            window.location.reload();
        }
    }
};

var ElementSelector = {
    currentElement: null,
    newVersions: {},

    createElementVersion: function(element) {
        var that = this;
        element = $(element);
        var id = element.attr('data-id');
        if (id) {
            $.ajax({
                url: '/admin/create-pageelement-version',
                type: 'post',
                data: { id: id },
                success: function(data) {
                    $('.page-element').load('/admin/page-element-form', {id: id}, timeoutHandler);
                },
                error: timeoutHandler
            })
        }
    },

    createAppVersion: function() {
        $.ajax({
            url: '/admin/create-app-version',
            type: 'post',
            data: {
                tag: $('#tagName').val()
            },
            success: function(data) {
                window.location.href = '/cms';
            },
            error: timeoutHandler
        })
    },

    restoreVersion: function(element, version) {
        element = $(element);
        var id = element.attr('data-id');
        if (id) {
            $.ajax({
                url: '/admin/restore-pageelement-version',
                type: 'post',
                data: {
                    id: id,
                    version: version
                },
                success: function(data, status) {
                    if (data.status === 'OK') {
                        $(ElementSelector.currentElement).replaceWith($(data.html).addClass('active'));
                        ElementSelector.currentElement = $('.app .element.active');
                        $(element).removeClass('error');
                        $('.page-element').load('/admin/page-element-form', {id: id}, function highlightRecentSelection() {
                            $('[data-id="' + version + '"]').addClass('active');
                        });
                    } else {
                        $(element).addClass('error');
                        timeoutHandler(data, status);
                    }
                },
                error: timeoutHandler
            });
        }
    },

    selectElement: function(elementId) {
        ElementSelector.currentElement = $('.app .element[data-id="' + elementId + '"]');
        $('.element').removeClass('active').filter('[data-id="' + elementId + '"]').addClass('active');
        $('.page-element').load('/admin/page-element-form', {id: elementId}, timeoutHandler);
    },

    changeValue: function(element, id, value, currentElement) {
        var that = this;
        if (element.data('last-save') !== element.val()) {
            element.data('last-save', element.val());
            $.ajax({
                url: '/admin/save-property-value',
                type: 'post',
                data: {
                    value: value,
                    id: id,
                    newVersion: ElementSelector.newVersions[element.prop('name')]
                },
                dataType: 'json',
                success: function(data, status) {
                    if (data.status === 'OK') {
                        currentElement.replaceWith($(data.html).addClass('active'));
                        ElementSelector.currentElement = $('.app .element.active');
                        element.removeClass('error').data('last-save', element.val());
                        $('#version-elements a.restore-version.active').removeClass('active');
                    } else {
                        element.addClass('error');
                        timeoutHandler(data, status);
                    }
                },
                error: timeoutHandler
            });
            ElementSelector.newVersions[element.prop('name')] = false;
        }
    }
};

$(document).ready(function() {

    $('.sections.header .table-of-contents a').each(function () {
        if (location.pathname.indexOf($(this).attr('href')) !== -1) {
            $(this).parents('li').addClass('selected');
        }
    });

    $(document).on('click', '.newVersion', function() {
        if (ElementSelector.currentElement !== null) {
            ElementSelector.createElementVersion(ElementSelector.currentElement);
        }
    });

    (function (cookieName) {
        var section = location.pathname.split('/')[1] || 'cms',
            tbToggle = JSON.parse($.cookie(cookieName) || '{}'),
            persistedState = tbToggle[section];
        $('.cms.toolbox .group').each(function (index) {
            if (persistedState) {
                $(this).toggleClass('collapsed', persistedState[index] !== 1);
            }
        });
        $('.cms.toolbox').on('click', '.group-header a', function (e) {
            e.preventDefault();
            var section = location.pathname.split('/')[1] || 'cms',
                tbToggle = JSON.parse($.cookie(cookieName) || '{}');
            $(this).closest('.group').toggleClass('collapsed');
            tbToggle[section] = [];
            $('.cms.toolbox .group').each(function () {
                tbToggle[section].push($(this).is('.collapsed') ? 0 : 1);
            });
            $.cookie(cookieName, JSON.stringify(tbToggle), { path: '/' } );
        });
    }('cms.toolbox.groups'));

    $('.app').on('click', '[href]', function (e) {
        e.preventDefault();
    });

    $(document).on('click', '.element', function (e) {
        e.preventDefault();
        var element = $(this),
            id = element.attr('data-id');
        if ($('#toolbox-elements').find('[data-id="' + id + '"]').size()) {
            if (element.parents('#toolbox-elements').size()) {
                var container = $('.app'),
                    boundaries = { top: $('.cms.header').height(), bottom: $(window).height() },
                    preview = container.find('[data-id="' + id + '"]'),
                    top = preview.offset().top,
                    bottom = top + preview.height(),
                    threshold = container.height() / 4;
                if (top < boundaries.top || bottom > boundaries.bottom) {
                    preview[0].scrollIntoView(true);
                    if (preview.offset().top < boundaries.top + threshold) {
                        container.scrollTop(container.scrollTop() - threshold);
                    }
                }
            }
            ElementSelector.selectElement(id);
        }
    });

    if ($('#toolbox-elements .element').length > 0) {
        ElementSelector.selectElement($('#toolbox-elements .element').first().attr('data-id'));
    }

    $(document).on('focus', '.page-element-property input, .page-element-property textarea', function() {
        ElementSelector.newVersions[$(this).prop('name')] = true;
    });

    $(document).on('click', '.app-version-restore', function() {
        if (!confirm('Do you want to restore this snapshot?')) {
            return false;
        }
        var id = $(this).attr('data-id');
        $.ajax({
            url: '/admin/restore-app-version',
            type: 'post',
            data: {
                id: id,
                pages: $('input#restorePages').prop('checked'),
                settings: $('input#restoreSettings').prop('checked'),
                brandings: $('input#restoreBrandings').prop('checked')
            },
            success: function(data, status) {
                if (data.status == 'OK') {
                    window.location.reload();
                } else {
                    timeoutHandler(data, status);
                }
            },
            error: timeoutHandler
        });
        return false;
    });

    $('.autosave').each(function memorize () {
        var editable = $(this);
        editable.data('last-save', editable.val());
    });

    $(document).on('blur', '.page-element-property input, .page-element-property textarea', function() {
        ElementSelector.changeValue($(this), $(this).attr('data-id'), $(this).val(), $('.app .element.active'));
    });

    $('.cms.settings, .cms.ci').each(function () {
        $(document).on('blur', '.autosave', function saveChanges() {
            var input = $(this);
            if (input.data('last-save') !== input.val()) {
                input.data('last-save', input.val());
                $.ajax({
                    url: location.pathname + (location.pathname.slice(-1) === '/' ? '' : '/') + 'save',
                    type: 'post',
                    data: {
                        name: input.attr('name'),
                        value: input.val()
                    },
                    dataType: 'json',
                    success: function(data, status) {
                        if (data.status == 'OK') {
                            input.removeClass('error');
                            $('.cms.ci').each(function () {
                                $('#brandingcss').attr('href', '/css/branding.css?time=' + new Date().getTime());
                            });
                            if (typeof data.value !== 'undefined') {
                                input.val(data.value);
                                input.data('last-save', data.value);
                            }
                        } else {
                            input.addClass('error');
                            timeoutHandler(data, status);
                        }
                    },
                    error: timeoutHandler
                });
            }
        });
        if ($(this).is('.ci')) {
            $('.upload').on('change', function (event) {
                var input = $(this);
                if (input.val()) {
                    var form =  input.parents('form');
                    form.iframePostForm({
                        iframeID: form.find('iframe').attr('id'),
                        json: true,
                        complete: function (data) {
                            var updateUrl;
                            if (data.status === 'OK') {
                                updateUrl = data.value;
                                input.next('.preview').find('img').attr('src', updateUrl);
                                $('#company img').attr('src', updateUrl);
                            }
                        }
                    }).submit();
                }
            });
        }
    });

    $(document).on('click', '.action.change-password', function() {
        window.location.href = '/cms/change-password';
    });

    $(document).on('click', '.create-app-version', function() {
        ElementSelector.createAppVersion();
        return false;
    });

    $(document).on('click', '.restore-version', function(event) {
        event.preventDefault();
        ElementSelector.restoreVersion(ElementSelector.currentElement, $(this).closest('li').attr('data-id'));
        return false;
    });

    if (location.pathname.indexOf('/cms') !== -1 && location.search) {
        var allowed = { user: 'Password', live: 'Application status', reset: 'Database' },
            token = location.search.slice(1).split('-'),
            item = allowed[token[0]],
            error = token[1] !== 'OK',
            element = $('.segment.' + token[0]);
        if (item) {
            element.append($('<div/>').addClass('attention').addClass(error ? 'failure' : 'success').text(item + (error ? ' has not been updated.' : ' has been updated.')));
            element.find('.attention').append($('<div/>').addClass('highlight'));
            element.find('.highlight').fadeOut(2000);
        }
    }

    $(document).on('click', '.action[data-request]', function(event) {
        var action = $(this).data('request');
        if (action.confirm && !confirm(action.confirm)) {
            return false;
        }
        $.ajax({
            url: action.url,
            type: 'post',
            success: function(data) {
                if (action.redirect) {
                    window.location.href = action.redirect.replace(/@/, data.status);
                }
            },
            error: function(data, status) {
                if (action.redirect) {
                    window.location.href = action.redirect.replace(/@/, 'ERR');
                } else {
                    timeoutHandler(data, status);
                }
            }
        });
        return false;
    });

    $(document).on('click', '.version-item .remove', function() {
        if (!confirm('Do you really want to remove this version?')) {
            return false;
        }
        $.ajax({
            url: '/admin/remove-pageelement-version',
            type: 'post',
            data: {
                id: $(this).closest('li').attr('data-id')
            },
            success: function(data, status) {
                if (data.status == 'OK') {
                    var elementId = $(ElementSelector.currentElement).attr('data-id');
                    $('.page-element').load('/admin/page-element-form', {id: elementId}, timeoutHandler);
                } else {
                    timeoutHandler(data, status);
                }
            },
            error: timeoutHandler
        });
        return false;
    });

    $(document).on('click', '.app-version-item .remove', function() {
        if (!confirm('Do you really want to remove this snapshot?')) {
            return false;
        }

        $.ajax({
            url: '/admin/remove-app-version',
            type: 'post',
            data: {
                id: $(this).closest('li').attr('data-id')
            },
            success: function(data) {
                window.location.href = '/cms';
            },
            error: timeoutHandler
        });
        return false;
    });

});