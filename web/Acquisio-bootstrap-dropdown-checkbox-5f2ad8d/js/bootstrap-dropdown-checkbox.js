/*

Copyright (C) 2013 Acquisio Inc. V0.1.1

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

*/
!function($) {

  "use strict";

  // **********************************
  // Templates
  // **********************************
  var template = '\
    <button class="dropdown-checkbox-toggle" data-toggle="dropdown" href="#">Dropdown trigger</button>\
    <div class="dropdown-checkbox-content">\
      <div class="dropdown-checkbox-header">\
        <input class="checkbox-all" type="checkbox"><input type="text" placeholder="Search" class="search"/>\
      </div>\
      <ul class="dropdown-checkbox-menu"></ul>\
    </div>'
  var templateOption = '<li><div class="layout"><input type="checkbox"/><label></label></div></li>'
  var templateNoResult = '<li><div class="layout"><label>No results.</label></div></li>'

  // **********************************
  // Constructor
  // **********************************
  var DropdownCheckbox = function(element, options) {
    // Create dropdown-checkbox
    $(element).html(template)
    $(element).addClass("dropdown-checkbox dropdown")

    this.$element = $(element).find(".dropdown-checkbox-toggle")
    this.$parent = $(element)
    this.$list = this.$parent.find("ul")
    this.elements = []
    this.hasChanges = false

    // Set options if exist
    if (typeof options === "object") {
      this.$element.text(options.title)
      this.$element.addClass(options.btnClass)
      this.autosearch = options.autosearch
      this.elements = options.data || []
      this._sort = options.sort || this._sort
      this.sortOptions = options.sortOptions
      this.hideHeader = options.hideHeader || options.hideHeader === undefined ? true : false
      this.templateButton = options.templateButton
    }

    if (this.templateButton) {
      this.$element.remove();
      this.$parent.prepend(this.templateButton);
      this.$element = this.$parent.find(".dropdown-checkbox-toggle")
    }

    // Add toggle for dropdown
    this.$element.attr("data-toggle", "dropdown")

    // Hide searchbox if needs
    if (this.hideHeader) this.$parent.find(".dropdown-checkbox-header").remove()

    // Prevent clicks on content
    this.$parent.find(".dropdown-checkbox-content").on("click.dropdown-checkbox.data-api", function(e) { e.stopPropagation() })

    // Open panel when the link is clicked
    this.$element.on("click.dropdown-checkbox.data-api", $.proxy(function() {
      // Remember current state
      var isOpened = this.$parent.hasClass("open")

      // Close all dropdown (bootstrap include)
      $(".dropdown").removeClass("open")

      // Reset last state
      if (isOpened) this.$parent.addClass("open")

      // Switch to next state
      this.$parent.toggleClass("open")

      // Notify changes on close
      if (this.hasChanges) this.$parent.trigger("change:dropdown-checkbox");
      this.hasChanges = false

      return false
    }, this))

    // Check or uncheck all checkbox
    this.$parent.find(".checkbox-all").on("change.dropdown-checkbox.data-api", $.proxy(function(event) {
      this.onClickCheckboxAll(event)
    }, this))

    // Events on document
    // - Close panel when click out
    // - Catch keyup events in search box
    // - Catch click on checkbox
    $(document).on('click.dropdown-checkbox.data-api', $.proxy(function () { 
      this.$parent.removeClass('open') 

      // Notify changes on close
      if (this.hasChanges) this.$parent.trigger("change:dropdown-checkbox");
      this.hasChanges = false
    }, this))

    this.$parent.find(".dropdown-checkbox-header").on('keyup.dropdown-checkbox.data-api', $.proxy(DropdownCheckbox.prototype.onKeyup, this))
    this.$parent.find("ul").delegate("li input[type=checkbox]", "click.dropdown-checkbox.data-api", $.proxy(this.onClickCheckbox, this))

    this._reset(this.elements)
  }

  // **********************************
  // DropdownCheckbox object
  // **********************************
  DropdownCheckbox.prototype = {
    constructor: DropdownCheckbox,

    // ----------------------------------
    // Methods to override
    // ----------------------------------
    _sort: function(elements) {
      return elements
    },

    // ----------------------------------
    // Internal methods
    // ----------------------------------
    _removeElements: function(ids) {
      this._isValidArray(ids)
      var tmp = []
          , toAdd = true
      for (var i = 0 ; i < this.elements.length ; i++) {
        for (var j = 0 ; j < ids.length ; j++) {
          if (ids[j] === parseInt(this.elements[i].id, 10)) toAdd = false
        }
        if (toAdd) tmp.push(this.elements[i])
        toAdd = true
      }
      this.elements = tmp
    },

    _getCheckbox: function(isChecked, isAll) {
      var results = []
      for (var i = 0 ; i < this.elements.length ; i++) {
        if (isChecked === this.elements[i].isChecked || isAll)
          results.push(this.elements[i])
      }
      return results
    },

    _isValidArray: function(arr) {
      if (!$.isArray(arr)) throw "[DropdownCheckbox] Requires array."
    },

    _findMatch: function(word, elements) {
      var results = []
      for (var i = 0 ; i < elements.length ; i++) {
        if (elements[i].label.toLowerCase().search(word.toLowerCase()) !== -1) results.push(elements[i])
      }
      return results
    },

    _setCheckbox: function(isChecked, id) {
      for(var i = 0 ; i < this.elements.length ; i++) {
        if (id == this.elements[i].id) { 
          this.elements[i].isChecked = isChecked
          break
        }
      }
    },

    _refreshCheckboxAll: function() {
      var $elements = this.$element.parents(".dropdown-checkbox").find("ul li input[type=checkbox]")
          , willChecked
      $elements.each(function() { willChecked = willChecked || $(this).prop("checked") })
      this.$element.parents(".dropdown-checkbox").find(".checkbox-all").prop("checked", willChecked)
    },

    _resetSearch: function() {
      this.$parent.find(".search").val("")
      this._reset(this.elements)
    },

    _appendOne: function(item) {
      var id = item.id
        , label = item.label
        , isChecked = item.isChecked
        , uuid = new Date().getTime() * Math.random()

      this.$list.append(templateOption)
      var $last = this.$list.find("li").last()
      $last.data("id", id)

      var $checkbox = $last.find("input")
      $checkbox.attr("id", uuid)
      if (isChecked) $checkbox.attr("checked", "checked")

      var $label = $last.find("label")
      $label.text(label)
      $label.attr("for", uuid)
    },

    _append: function(elements) {
      if (!$.isArray(elements)) {
        this._appendOne(elements)
      }
      else {
        elements = this._sort(elements, this.sortOptions)
        for (var i = 0 ; i < elements.length ; i++) { this._appendOne(elements[i]) }
      }
    },

    _reset: function(elements) {
      this._isValidArray(elements)
      this.$list.empty()
      this._append(elements)
      this._refreshCheckboxAll()
    },

    // ----------------------------------
    // Event methods
    // ----------------------------------
    onKeyup: function(event) {
      var keyCode = event.keyCode
          , word = $(event.target).val()

      if (word.length < 1 && keyCode === 8) {
        return this._reset(this.elements)
      }
      
      if (keyCode === 27) {
        return this._resetSearch()
      }

      if (this.autosearch || keyCode === 13) {
        var results = this._findMatch(word, this.elements)
        if (results.length > 0) return this._reset(results)
        return this.$list.html(templateNoResult)
      }
    },

    onClickCheckboxAll: function(event) {
      var isChecked = $(event.target).is(":checked")
          , $elements = this.$parent.find("ul li")
          , self = this
      $elements.each(function() {
        $(this).find("input[type=checkbox]").prop("checked", isChecked)
        self._setCheckbox(isChecked, $(this).data("id"))
      })
      this.$parent.trigger("checked:all", isChecked)
      isChecked ? this.$parent.trigger("check:all") : this.$parent.trigger("uncheck:all")

      // Notify changes
      this.hasChanges = true
    },

    onClickCheckbox: function(event) {
      this._setCheckbox($(event.target).prop("checked"), $(event.target).parent().parent().data("id"))
      this._refreshCheckboxAll()
      this.$parent.trigger("checked", $(event.target).prop("checked"))
      $(event.target).prop("checked") ? this.$parent.trigger("check:checkbox") : this.$parent.trigger("uncheck:checkbox")

      // Notify changes
      this.hasChanges = true
    },

    // ----------------------------------
    // External methods
    // ----------------------------------
    checked: function() {
      return this._getCheckbox(true)
    },

    unchecked: function() {
      return this._getCheckbox(false)
    },

    items: function() {
      return this._getCheckbox(undefined, true)
    },

    append: function(elements) {
      if (!$.isArray(elements)) {
        this.elements.push(elements)
      } else {
        for (var i = 0 ; i < elements.length ; i ++)
          this.elements.push(elements[i])
      }

      this._append(elements)

      // Notify changes
      this.hasChanges = true
    },

    remove: function(ids) {
      this._isValidArray(ids)
      this._removeElements(ids)
      this._reset(this.elements)

      // Notify changes
      this.hasChanges = true
    },

    reset: function(elements) {
      if (!$.isArray(elements)) {
        this.elements = [elements]
      } else {
        this.elements = elements
      }

      this._reset(elements)

      // Notify changes
      this.hasChanges = true
    }
  }

  // **********************************
  // Add DropdownCheckbox as plugin for JQuery
  // **********************************
  $.fn.dropdownCheckbox = function (option, more) {
    var $this = $(this)
        , data = $this.data('dropdownCheckbox')
        , options = typeof option == 'object' && option
    if (!data) $this.data('dropdownCheckbox', (data = new DropdownCheckbox(this, options)))
    if (typeof option == 'string') return data[option](more)
    return this
  }

  $.fn.dropdownCheckbox.Constructor = DropdownCheckbox

}(window.jQuery);
