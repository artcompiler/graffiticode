// An example Backbone application contributed by
// [Jérôme Gravel-Niquet](http://jgn.me/). This demo uses a simple
// [LocalStorage adapter](backbone-localstorage.html)
// to persist Backbone models within your browser.

// Load the application once the DOM is ready, using `jQuery.ready`:
$(function(){

  // Label Model
  // ----------

    var tableName = rootName.substring(0, rootName.indexOf('.'))

  // Our basic **Label** model has `title`, `order`, and `done` attributes.
  var Label = Backbone.Model.extend({

    // Default attributes for the label item.
    defaults: function() {
	return {
            text: "empty label...",
            order: Labels.nextOrder(),
            done: false
	};
    },

    // Ensure that each label created has `text`.
    initialize: function() {
      if (!this.get("text")) {
        this.set({"text": this.defaults().text});
      }
      if (!this.get("label")) {
        this.set({"label": lastCls});
      }
    },

    // Toggle the `done` state of this label item.
    toggle: function() {
      this.save({done: !this.get("done")});
    },

    // Remove this Label from *localStorage* and delete its view.
    clear: function() {
      this.destroy();
    }

  });

  // Label Collection
  // ---------------

  var LabelList = Backbone.Collection.extend({

    url: "/notes",

    // Reference to this collection's model.
    model: Label,

    // Filter down the list of all label items that are finished.
    selected: function() {
      return this.filter(function(label){ return label.get('label')===window.lastCls });
    },

    // Filter down the list of all label items that are finished.
    done: function() {
      return this.filter(function(label){ return label.get('done'); });
    },

    // Filter down the list to only label items that are still not finished.
    remaining: function() {
      return this.without.apply(this, this.done());
    },

    // We keep the Labels in sequential order, despite being saved by unordered
    // GUID in the database. This generates the next order number for new items.
    nextOrder: function() {
      if (!this.length) return 1;
      return this.last().get('order') + 1;
    },

    // Labels are sorted by their original insertion order.
    comparator: function(label) {
      return label.get('order');
    }

  });

  // Create our global collection of **Labels**.
  var Labels = new LabelList;

  // Label Item View
  // --------------

  // The DOM element for a label item...
  var LabelView = Backbone.View.extend({

    //... is a list tag.
    tagName:  "li",

    // Cache the template function for a single item.
    template: _.template($('#item-template').html()),

    // The DOM events specific to an item.
    events: {
      "click .toggle"   : "toggleDone",
      "dblclick .view"  : "edit",
      "click a.destroy" : "clear",
      "keypress .edit"  : "updateOnEnter",
      "blur .edit"      : "close"
    },

    // The LabelView listens for changes to its model, re-rendering. Since there's
    // a one-to-one correspondence between a **Label** and a **LabelView** in this
    // app, we set a direct reference on the model for convenience.
    initialize: function() {
      this.model.bind('change', this.render, this);
      this.model.bind('destroy', this.remove, this);
    },

    // Re-render the texts of the label item.
    render: function() {
	// only render if it is for the current label
	if (this.model.attributes.label === window.lastCls) {
	    this.$el.html(this.template(this.model.toJSON()));
	    this.$el.toggleClass('done', this.model.get('done'));
	    this.input = this.$('.edit');
	}
	return this;
    },

    // Toggle the `"done"` state of the model.
    toggleDone: function() {
      this.model.toggle();
    },

    // Switch this view into `"editing"` mode, displaying the input field.
    edit: function() {
      this.$el.addClass("editing");
      this.input.focus();
    },

    // Close the `"editing"` mode, saving changes to the label.
    close: function() {
      var value = this.input.val();
      if (!value) this.clear();
      this.model.save({text: value});
      this.$el.removeClass("editing");
    },

    // If you hit `enter`, we're through editing the item.
    updateOnEnter: function(e) {
      if (e.keyCode == 13) this.close();
    },

    // Remove the item, destroy the model.
    clear: function() {
      this.model.clear();
    }

  });

  // The Application
  // ---------------

  // Our overall **AppView** is the top-level piece of UI.
  var AppView = Backbone.View.extend({

    // Instead of generating a new element, bind to the existing skeleton of
    // the App already present in the HTML.
    el: $("#labelapp"),

    // Our template for the line of statistics at the bottom of the app.
    statsTemplate: _.template($('#stats-template').html()),

    // Delegated events for creating new items, and clearing completed ones.
    events: {
      "keypress #new-label":  "createOnEnter",
      "click #clear-completed": "clearCompleted",
      "click #toggle-all": "toggleAllComplete"
    },

    // At initialization we bind to the relevant events on the `Labels`
    // collection, when items are added or changed. Kick things off by
    // loading any preexisting labels that might be saved in the persistent store.
    initialize: function() {

	this.input = this.$("#new-label");
	//this.allCheckbox = this.$("#toggle-all")[0];
	
	Labels.bind('add', this.addOne, this);
	Labels.bind('reset', this.addAll, this);
	Labels.bind('all', this.render, this);
	
	this.footer = this.$('footer');
	this.main = $('#main');

	Labels.fetch({data: {table: tableName}});
    },

    // Re-rendering the App just means refreshing the statistics -- the rest
    // of the app doesn't change.
    render: function() {
	var done = Labels.done().length;
	var remaining = Labels.remaining().length;
	
	// refresh the list
	this.$("#label-list").empty()
	_.each(Labels.selected(),this.addOne)

	if (Labels.length) {
            this.main.show();
            this.footer.show();
            this.footer.html(this.statsTemplate({done: done, remaining: remaining}));
	} else {
            this.main.hide();
            this.footer.hide();
	}

	//this.allCheckbox.checked = !remaining;
    },

    // Add a single label item to the list by creating a view for it, and
    // appending its element to the `<ul>`.
    addOne: function(label) {
      var view = new LabelView({model: label});
      this.$("#label-list").append(view.render().el);
    },

    // Add all items in the **Labels** collection at once.
    addAll: function() {
      Labels.each(this.addOne)
    },


    // If you hit return in the main input field, create new **Label** model,
    // persisting it to *localStorage*.
    createOnEnter: function(e) {
      if (e.keyCode != 13) return;
      if (!this.input.val()) return;

      Labels.create({text: this.input.val()});
      this.input.val('');
    },

    // Clear all done label items, destroying their models.
    clearCompleted: function() {
      _.each(Labels.done(), function(label){ label.clear(); });
      return false;
    },

    toggleAllComplete: function () {
	//var done = this.allCheckbox.checked;
      Labels.each(function (label) { label.save({'done': done}); });
    }

  });

  // Finally, we kick things off by creating the **App**.
  window.notes = new AppView;

});
