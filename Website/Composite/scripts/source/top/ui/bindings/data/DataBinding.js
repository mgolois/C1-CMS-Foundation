DataBinding.prototype = new Binding;
DataBinding.prototype.constructor = DataBinding;
DataBinding.superclass = Binding.prototype;

DataBinding.AUTOGENERATED = "autogenerateddatabindingname";

DataBinding.TYPE_NUMBER = "number";
DataBinding.TYPE_INTEGER = "integer";
DataBinding.TYPE_STRING = "string";

DataBinding.CLASSNAME_INVALID = "invalid";
DataBinding.CLASSNAME_INFOBOX = "infobox";
DataBinding.CLASSNAME_WARNING = "warning";
DataBinding.CLASSNAME_FOCUSED = "focused";
DataBinding.CLASSNAME_DISABLED = "disabled";


/**
 * Populating expressions when user logs in.
 * Becuase they may be language dependant.
 */
EventBroadcaster.subscribe ( BroadcastMessages.APPLICATION_LOGIN, {
	handleBroadcast : function () {
		var expressions = new List ( ConfigurationService.GetValidatingRegularExpressions ( "dummy" ));
		expressions.each ( function ( entry ) {
			DataBinding.expressions [ entry.Key ] = new RegExp ( entry.Value );
		});

		var localizedWarnings = {
			"required": StringBundle.getString("ui", "Validation.Required"),
			"number": StringBundle.getString("ui", "Validation.InvalidField.Number"),
			"integer": StringBundle.getString("ui", "Validation.InvalidField.Integer"),
			"programmingidentifier": StringBundle.getString("ui", "Validation.InvalidField.ProgrammingIdentifier"),
			"programmingnamespace": StringBundle.getString("ui", "Validation.InvalidField.ProgrammingNamespace"),
			"url": StringBundle.getString("ui", "Validation.InvalidField.Url"),
			"minlength": StringBundle.getString("ui", "Validation.StringLength.Min"),
			"maxlength": StringBundle.getString("ui", "Validation.StringLength.Max"),
			"currency": StringBundle.getString("ui", "Validation.InvalidField.Currency"),
			"email": StringBundle.getString("ui", "Validation.InvalidField.Email"),
			"guid": StringBundle.getString("ui", "Validation.InvalidField.Guid")
		}

		for (var prop in localizedWarnings) {
			DataBinding.warnings[prop] = localizedWarnings[prop];
		}
	}
});


/**
 * Regular expressions used for validating. Populated 
 * by ConfigurationService on login (see abowe).
 * @type {HashMap<string><RegExp>}
 */
DataBinding.expressions = {
	
	// populated by server - just to illustrate the structure...
	
	/*
	"number" 	: /^[0-9]+(\,[0-9]+)?$/,
	"integer" 	: /^[0-9]+$/,
	"currency" 	: /^[0-9]{1,3}(\.[0-9]{3})*(\,[0-9]{1,2})?$/,
	"email"		: /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,})+$/,
	"string"	: /[a-å]|[A-Å]|[0-9]/
	"url"		: /^/|://|mailto:|javascript:/
	*/
}

/**
 * Warnings. This is written *inside* the control, not in a balloon. Not all DataBindings 
 * may support warnings; only bindings that rely on direct keyboard input.
 * @see {DataInputBinding}
 * @see {TextBoxBinding} 
 * TODO: Move to ConfigurationService?
 */
DataBinding.warnings = {

	"required" 	                : "Required",
	"number" 	                : "Numbers only",
	"integer" 	                : "Integers only",
	"programmingidentifier"     : "Invalid identifier",
	"programmingnamespace"      : "Invalid namespace",
	"url"						: "Invalid URL",
	"minlength"					: "{0} characters minimum",
	"maxlength"					: "{0} characters maximum",
	"currency"					: "Invalid notation",
	"email"						: "Invalid e-mail",
	"guid"						: "Invalid GUID"
}

/**
 * Errors (balloons texts). All DataBindings support errors. 
 * Remember that error presentation is handled by the FieldBinding.
 * @see {FieldBinding#handleAction} 
 * TODO: Move to ConfigurationService?
 */
DataBinding.errors = {
	
	"programmingidentifier"     : "An identifier must not contain spaces or special characters. Only characters a-z, A-Z, 0-9 and '_' are allowed. An identifier must begin with a letter (not a number).",
	"programmingnamespace"      : "A namespace must take the form Example.Name.Space where only characters a-z, A-Z, 0-9, '_' and dots (.) are allowed. Each part of the namespace must begin with a letter (not a number).",
	"url"						: "A valid URL must begin with a forward slash, designating the site root, or an URL scheme name such as http://. Simpliefied addresses such as www.example.com cannot be resolved reliably by the browser. Relative URLs are not supported."
}

/**
 * Retrieve the string label of the FieldDescBinding hosting any given binding.
 * @param {Binding} binding 
 * @return {string}
 */
DataBinding.getAssociatedLabel = function ( binding ) {
	
	var result = null;
	var field = binding.getAncestorBindingByLocalName ( "field" );
	
	if ( field && field instanceof FieldBinding ) {
		var desc = field.getDescendantBindingByLocalName ( "fielddesc" );
		if ( desc && desc instanceof FieldDescBinding ) {
			result = desc.getLabel ();
		}
	}
	return result;
}

/**
 * @class
 * This is sort of an abstract class. The real stuff goes on in subclasses.
 * @implements {IData}
 */
function DataBinding () {

	/**
	 * @type {SystemLogger}
	 */
	this.logger = SystemLogger.getLogger ( "DataBinding" );
	
	/**
	 * @type {string}
	 */
	this._name = null;
	
	/**
	 * @type {boolean}
	 */
	this.isDirty = false;
	
	/**
	 * @implements {IData}
	 * @type {boolean}
	 */
	this.isFocusable = true;
	
	/**
	 * @implements {IData}
	 * @type {boolean}
	 */
	this.isFocused = false;
	
	/**
	 * The errortext associated, popularly known as balloons. 
	 * Remember that errors may also be injected by the server 
	 * in a special UpdatePanelBinding.
	 * @type {string} 
	 */
	this.error = null;
	
	/*
	 * Returnable.
	 */
	return this;
}

/**
 * Identifies binding.
 */
DataBinding.prototype.toString = function () {

	return "[DataBinding]";
}

/**
 * Register binding with DocumentManager.
 * @overloads {Binding#onBindingRegister}
 */
DataBinding.prototype.onBindingRegister = function () {

	DataBinding.superclass.onBindingRegister.call ( this );
	this.propertyMethodMap [ "isdisabled" ] = this.setDisabled; // HIGHLY QUESTIONABLE!
	
	/*
	 * Register name (backendish concept) with DataManager.
	 */
	var name = this._name ? this._name : this.getProperty ( "name" );
	if ( name == null ) {
		name = DataBinding.AUTOGENERATED + KeyMaster.getUniqueKey ();
	}
 	this.setName ( name );
}

/**
 * Associate an error (balloon) to this bindings invalid state?
 * @overloads {Binding#onBindingAttach}
 */
DataBinding.prototype.onBindingAttach = function () {
	
	DataBinding.superclass.onBindingAttach.call ( this );
 	if ( this.getProperty ( "error" )) {
	 	this.error = this.getProperty ( "error" );
	}
}

/**
 * Unregister binding with the window-scope {@link DataManager}.
 * @overloads {Binding#onBindingDispose}
 */
DataBinding.prototype.onBindingDispose = function () {
	
	DataBinding.superclass.onBindingDispose.call ( this );
	
	if ( this.isFocused == true ) {
		this.blur ();
	}
	
	var dataManager = this.bindingWindow.DataManager;
	dataManager.unRegisterDataBinding ( this._name );
}

/**
 * Set name. The DataBinding is registered with the window-scope  
 * {@link DocumentManager} for easy retrieval in other contexts.
 * @param {string} name
 */
DataBinding.prototype.setName = function ( name ) {
	
	var dataManager = this.bindingWindow.DataManager;

	if ( dataManager.getDataBinding ( name )) {
		dataManager.unRegisterDataBinding ( name );
	}
	dataManager.registerDataBinding ( name, this );
	this.setProperty ( "name", name );
	this._name = name;
}

/**
 * Get name.
 * @implements {IData}
 * @return {string}
 */
DataBinding.prototype.getName = function () {
	
	return this._name;
}

/**
 * Focus.
 * @implements {IData}
 */
DataBinding.prototype.focus = function () {
	
	if ( this.isFocusable && !this.isFocused ) {
		this.isFocused = true;
		this.dispatchAction ( Binding.ACTION_FOCUSED );
		this.attachClassName ( DataBinding.CLASSNAME_FOCUSED );
	}
};

/**
 * Blur.
 * @implements {IData}
 */
DataBinding.prototype.blur = function () {
	
	if ( this.isFocused ) {
		this.isFocused = false;
		this.dispatchAction ( Binding.ACTION_BLURRED );
		this.detachClassName ( DataBinding.CLASSNAME_FOCUSED );
	}
};

/**
 * Pollute dirty flag.
 */
DataBinding.prototype.dirty = function () {
	
	this.bindingWindow.DataManager.dirty ( this );
};

/**
 * Clear dirty flag.
 */
DataBinding.prototype.clean = function () {
	
	this.bindingWindow.DataManager.clean ( this );
};

// ABSTRACT METHODS ............................................................

/**
 * Validate.
 * @implements {IData}
 * @return {boolean}
 */
DataBinding.prototype.validate = Binding.ABSTRACT_METHOD;

/**
 * Manifest. This will write form elements into page DOM 
 * so that the server recieves something on form submit.
 * @implements {IData}
 */
DataBinding.prototype.manifest = Binding.ABSTRACT_METHOD;

/**
 * Get value. This is intended for serversice processing.
 * @implements {IData}
 * @return {string}
 */
DataBinding.prototype.getValue = Binding.ABSTRACT_METHOD;

/**
 * Set value.
 * @implements {IData}
 * @param {string} value
 */
DataBinding.prototype.setValue = Binding.ABSTRACT_METHOD;

/**
 * Get result. This is intended for clientside processing.
 * @implements {IData}
 * @return {object}
 */
DataBinding.prototype.getResult = Binding.ABSTRACT_METHOD;

/**
 * Set result.
 * @implements {IData}
 * @param {object} value
 */
DataBinding.prototype.setResult = Binding.ABSTRACT_METHOD;
