sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageBox",
    "sap/m/MessageToast"
], (Controller, MessageBox, MessageToast) => {
    "use strict";

    return Controller.extend("com.dp.zsalesordercrud.controller.ObjectPage", {
        onInit: function () {
            debugger;

            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.getRoute("ObjectPage").attachPatternMatched(this._onObjectMatched, this);
            // ALWAYS use same OData Model as ListReport
            this.oModel = this.getOwnerComponent().getModel();

            // Ensure metadata is ready before update
            this.oModel.metadataLoaded();

            this.productMode = "";
        },
        _onObjectMatched: function (oEvent) {
            var sSupplierId = oEvent.getParameter("arguments").supplierId;
            var oView = this.getView();
            var oODataModel = this.oModel; // global OData model

            // Bind Object Header (Supplier info)
            oView.bindElement({
                path: "/Suppliers(" + sSupplierId + ")",
                parameters: {
                    expand: "Address"   // optional
                },
                refresh: true,
                model: undefined
            });

            // Bind Products table DIRECTLY from ODataModel (NO JSON)
            var oTable = this.byId("productsTable");

            oTable.bindItems({
                path: "/Suppliers(" + sSupplierId + ")/Products",
                parameters: {
                    expand: "Category"   // you also need Category
                },
                template: new sap.m.ColumnListItem({
                    cells: [
                        new sap.m.Text({ text: "{Name}" }),
                        new sap.m.HBox({
                            items: [
                                new sap.m.Text({ text: "{Price}" }),
                                new sap.m.Input({ value: "{Price}", visible: false, width: "6rem" })
                            ]
                        }),
                        new sap.m.Text({ text: "{Category/Name}" })
                    ]
                })
            });
        },
        // _onObjectMatched: function (oEvent) {
        //     var sSupplierId = oEvent.getParameter("arguments").supplierId;

        //     var sPath = "/Suppliers(" + sSupplierId + ")";
        //     this.getView().bindElement(sPath);

        //     var oView = this.getView();
        //     var oModel = oView.getModel();

        //     // Bind Supplier info to the view directly
        //     oModel.read("/Suppliers(" + sSupplierId + ")", {
        //         urlParameters: { "$expand": "Products/Category, Products/Supplier" },
        //         success: function (oData) {
        //             oView.setModel(new sap.ui.model.json.JSONModel(oData), "supplierModel");
        //         },
        //         error: function () {
        //             MessageToast.show("Failed to load Supplier data");
        //         }
        //     });
        // },
        // _onObjectMatched: function (oEvent) {
        //     var sSupplierId = oEvent.getParameter("arguments").supplierId;
        //     var oModel = this.getView().getModel();
        //     var oTable = this.byId("productsTable");

        //     // Read Products explicitly with Category
        //     oModel.read("/Suppliers(" + sSupplierId + ")/Products", {
        //         urlParameters: { "$expand": "Category" },
        //         success: function (oData) {
        //             var oJSON = new sap.ui.model.json.JSONModel(oData.results);
        //             oTable.setModel(oJSON, "productsModel");
        //             oTable.bindItems({
        //                 path: "productsModel>/",
        //                 template: new sap.m.ColumnListItem({
        //                     cells: [
        //                         new sap.m.Text({ text: "{productsModel>Name}" }),
        //                         new sap.m.Text({ text: "{productsModel>Price}" }),
        //                         new sap.m.Text({ text: "{productsModel>Category/Name}" })
        //                     ]
        //                 })
        //             });
        //         },
        //         error: function () {
        //             MessageToast.show("Failed to load Products");
        //         }
        //     });
        // },

        onBeforeRendering: function () {
            debugger;
            var oProductsTable = this.getView().byId("productsTable");

            // Ensure the Products table is initialized
            if (oProductsTable) {
                // Detach any existing handlers to avoid duplicates
                oProductsTable.detachUpdateFinished(this.onTableUpdateFinished, this);
                oProductsTable.attachUpdateFinished(this.onTableUpdateFinished, this);
            } else {
                // If products table not yet ready, wait for it
                oProductsTable.attachInitialise(function () {
                    oInnerTable.attachUpdateFinished(this.onTableUpdateFinished, this);
                }, this);
            }
        },

        // Helper method for clarity
        onTableUpdateFinished: function (oEvent) {
            debugger;
            var iProductRowCount = oEvent.getParameter("total");
            var oEditProductButton = this.getView().byId("editProductButtonId");
            // var oDeleteProductButton = this.getView().byId("deleteProductButtonId");

            oEditProductButton.setVisible(iProductRowCount > 0);
            oEditProductButton.setEnabled(iProductRowCount > 0);

            // oDeleteProductButton.setVisible(iProductRowCount > 0);
            // oDeleteProductButton.setEnabled(iProductRowCount > 0);
        },

        //function declarations
        openAddEditProductFragment: function () {
            //checks if fragment already exists
            if (!this.oAddProductFragment) {
                //creates the fragment
                this.oAddProductFragment = new sap.ui.xmlfragment("com.dp.zsalesordercrud.view.fragments.addProduct", this);
                this.getView().addDependent(this.oAddProductFragment);
            }
            //reset form before opening
            sap.ui.getCore().byId("oPProductId").setValue("");
            sap.ui.getCore().byId("oPProductNameId").setValue("");
            sap.ui.getCore().byId("oPProductDescriptionId").setValue("");
            sap.ui.getCore().byId("oPProductQuantityId").setValue("");
            sap.ui.getCore().byId("oPProductPriceId").setValue("");
            sap.ui.getCore().byId("oPProductStockId").setValue("");

            //Disables Save Button as NO DATA in form
            sap.ui.getCore().byId("saveProductButtonId").setEnabled(false);


            this.oAddProductFragment.open();
        },
        //function calls
        _formatODataDate: function (vDate) {
            if (!vDate) return null;
            if (typeof vDate === "string" && vDate.startsWith("/Date(")) {
                return vDate; // already formatted
            }
            return "/Date(" + new Date(vDate).getTime() + ")/";
        },
        onPressAddProduct: function () {
            debugger;
            this.productMode = "add";
            this.openAddEditProductFragment();
        },
        onPressEditProduct: function () {
            debugger;
            var oEditBtn = this.byId("editProductButtonId");
            var oCancelBtn = this.byId("cancelProductButtonId");
            var oTable = this.byId("productsTable");
            var aSelected = oTable.getSelectedItems();

            // ----- EDIT MODE -----
            if (oEditBtn.getText() === "Edit") {

                if (aSelected.length !== 1) {
                    MessageBox.error("Select exactly one product to edit.");
                    return;
                }

                var oRow = aSelected[0];
                var oCell = oRow.getCells()[1];    // Price column (dynamic because column order matches XML)
                var aItems = oCell.getItems();

                aItems[0].setVisible(false);      // Text
                aItems[1].setVisible(true);       // Input
                aItems[1].focus();

                this._editCtxPath = oRow.getBindingContext().getPath();

                oEditBtn.setText("Save");
                oEditBtn.setIcon("sap-icon://save");
                oCancelBtn.setVisible(true);
                return;
            }


            //SAVE
            if (oEditBtn.getText() === "Save") {

                var oRow = aSelected[0];
                var oProd = oRow.getBindingContext().getObject();
                var sNewPrice = oRow.getCells()[1].getItems()[1].getValue();
                var that = this;

                // Build correct payload
                var oPayload = {
                    ID: oProd.ID,
                    Name: oProd.Name,
                    Description: oProd.Description,
                    Rating: oProd.Rating,
                    Price: String(parseFloat(sNewPrice)),
                    ReleaseDate: this._formatODataDate(oProd.ReleaseDate),
                    DiscontinuedDate: this._formatODataDate(oProd.DiscontinuedDate)
                };

                this.oModel.update("/Products(" + oProd.ID + ")", oPayload, {
                    success: function () {
                        MessageToast.show("Product updated successfully");
                        that.getView().getModel().refresh(true);
                    },
                    error: function (err) {
                        MessageBox.error("Update failed");
                        console.error(err);
                    }
                });

                // revert UI
                var aItems = oRow.getCells()[1].getItems();
                aItems[1].setVisible(false);
                aItems[0].setVisible(true);
                aItems[0].setText(sNewPrice);

                oEditBtn.setText("Edit");
                oEditBtn.setIcon("sap-icon://edit");
                oCancelBtn.setVisible(false);
                this._editCtxPath = null;

                oTable.removeSelections();
            }
        },

        onPressCancelProduct: function () {
            debugger;
            var oTable = this.byId("productsTable");
            var aSelected = oTable.getSelectedItems();

            if (aSelected.length === 1 && this._editCtxPath) {
                var oRow = aSelected[0];
                var oCell = oRow.getCells()[1];
                var aItems = oCell.getItems();

                // revert
                aItems[1].setVisible(false);
                aItems[0].setVisible(true);

                // restore original model value
                var oProd = oRow.getBindingContext().getObject();
                aItems[1].setValue(oProd.Price);
            }

            this.byId("editProductButtonId").setText("Edit");
            this.byId("editProductButtonId").setIcon("sap-icon://edit");
            this.byId("cancelProductButtonId").setVisible(false);

            this._editCtxPath = null;
            oTable.removeSelections();
        },
        _getPriceColumnIndex: function () {
            var oTable = this.getView().byId("productsTable");
            var aColumns = oTable.getColumns();

            for (var i = 0; i < aColumns.length; i++) {
                // if (aColumns[i].getLabel().getText() === "Price") {
                //     return i;
                // }
                var oHeader = aColumns[i].getHeader();   // <-- Correct API

                if (oHeader && oHeader.getText && oHeader.getText() === "Price") {
                    return i;
                }
            }
            return -1;
        },
        _getPriceColumnIndex: function () {
            var oTable = this.getView().byId("productsTable");
            var aColumns = oTable.getColumns();
            for (var i = 0; i < aColumns.length; i++) {
                var oHeader = aColumns[i].getHeader();
                if (oHeader && oHeader.getText && oHeader.getText() === "Price") {
                    return i;
                }
            }
            return -1;
        },


    });
});

