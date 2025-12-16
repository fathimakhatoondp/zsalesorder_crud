sap.ui.define([
    "sap/ui/core/UIComponent",
    "com/dp/zsalesordercrud/model/models"
], (UIComponent, models) => {
    "use strict";

    return UIComponent.extend("com.dp.zsalesordercrud.Component", {
        metadata: {
            manifest: "json",
            interfaces: [
                "sap.ui.core.IAsyncContentCreation"
            ]
        },

        init() {
            // call the base component's init function
            UIComponent.prototype.init.apply(this, arguments);

            // set the device model
            this.setModel(models.createDeviceModel(), "device");

            var oModel = this.getModel();
            if (oModel && oModel.setUseBatch) {
                oModel.setUseBatch(false);
            }

            // enable routing
            this.getRouter().initialize();
        }
    });
});