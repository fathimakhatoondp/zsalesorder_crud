sap.ui.define([
	"sap/ui/core/mvc/Controller",

], function (Controller) {
	"use strict";

	return {
		getStreet: function (oAddress) {
			debugger;
			return oAddress && oAddress.Street ? oAddress.Street : "";
		}
	};
});