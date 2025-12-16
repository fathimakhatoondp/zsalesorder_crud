sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    // "../model/formatter"
], (Controller, MessageBox, MessageToast, Filter, FilterOperator) => {
    "use strict";

    return Controller.extend("com.dp.zsalesordercrud.controller.ListReport", {
        // formatter: formatter,
        onInit() {
            this.oModel = new sap.ui.model.odata.ODataModel("/V2/(S(ywzlxk0to3s33pvsmznmv4og))/OData/OData.svc/");
            this.getView().setModel(this.oModel);
            this.supplierMode = "";
            this.onGlobalSearch();
        },
        onGlobalSearch: function () {
            debugger;
            var sValue = this.byId("smartFilterBarId").getBasicSearchValue();

            if (sValue) {
                var isNumeric = !isNaN(sValue);
                this.filters = new Filter([
                    isNumeric ? new Filter("ID", FilterOperator.EQ, sValue) : null,
                    new Filter("Name", FilterOperator.Contains, sValue, false)
                ].filter(Boolean), false);
            } else {
                // this.filters = [];   // important!
                this.filters = null
            }

            this.byId("suppliersSmartTableId").rebindTable();
        },
        onClickValueHelp: function (oEvent) {
            debugger;
            // 1) WHICH FIELD TRIGGERED VALUEHELP?
            var oField = oEvent.getSource();             // MultiInput control
            var sFieldId = oField.getId();               // "__xmlview0--supplierIdFilterId"

            // Distinguish ID vs Name
            if (sFieldId.includes("supplierIdFilterId")) {
                this.openValueHelpFragment("ID", oField);
            }
            else if (sFieldId.includes("supplierNameFilterId")) {
                this.openValueHelpFragment("Name", oField);
            }

            // if (!oValueHelpFragment) {
            //     //creates the fragment
            //     this.oValueHelpFragment = new sap.ui.xmlfragment("com.dp.zsalesordercrud.view.fragments.valueHelp", this);
            //     this.oValueHelpFragment.setModel(this.oModel); //Attach OData Model to fragment
            //     this.getView().addDependent(this.oValueHelpFragment);
            // }
        },
        openValueHelpFragment: async function (sField, oInput) {

            this._currentVhField = sField;
            this._currentInput = oInput;

            // Load data for value help
            var aValues = await this.fetchDistinctValues(sField);

            // Create VH model
            var oVHModel = new sap.ui.model.json.JSONModel({ data: aValues });
            this.getView().setModel(oVHModel, "vhModel");

            // Load fragment if not loaded yet
            if (!this._oVhFragment) {
                this._oVhFragment = await sap.ui.core.Fragment.load({
                    name: "com.dp.zsalesordercrud.view.fragments.valueHelp",
                    controller: this
                });
                this.getView().addDependent(this._oVhFragment);
            }

            this._oVhFragment.open();
        },
        fetchDistinctValues: function (sField) {
            return new Promise((resolve) => {
                this.getView().getModel().read("/Suppliers", {
                    success: function (oData) {
                        let set = new Set();
                        oData.results.forEach(item => {
                            let val = item[sField];
                            // FIX: include ID = 0 also
                            if (val !== null && val !== undefined) {
                                set.add(val);
                            }
                        });
                        resolve(Array.from(set).map(v => ({ value: v })));
                    }
                });
            });
        },
        onValueHelpSearch: function (oEvent) {
            var sQuery = oEvent.getParameter("value");
            var oFilter = new sap.ui.model.Filter("value", FilterOperator.Contains, sQuery);
            oEvent.getSource().getBinding("items").filter([oFilter]);
        },
        onValueHelpConfirm: function (oEvent) {
            var aSelectedItems = oEvent.getParameter("selectedItems");
            var oInput = this._currentInput;

            oInput.removeAllTokens();

            aSelectedItems.forEach(item => {
                oInput.addToken(new sap.m.Token({
                    key: item.getTitle(),
                    text: item.getTitle()
                }));
            });
        },
        // onBeforeRebindTable: function (oEvent) {
        //     if (this.filters && this.filters.length) {
        //         oEvent.getParameter("bindingParams").filters = this.filters;
        //     }
        //     var aIdTokens = this.byId("supplierIdFilterId").getTokens();
        //     if (aIdTokens.length) {
        //         aFilters.push(
        //             new Filter(
        //                 aIdTokens.map(t => new Filter("ID", FilterOperator.EQ, t.getKey())),
        //                 false
        //             )
        //         );
        //     }

        //     var aNameTokens = this.byId("supplierNameFilterId").getTokens();
        //     if (aNameTokens.length) {
        //         aFilters.push(
        //             new Filter(
        //                 aNameTokens.map(t => new Filter("Name", FilterOperator.EQ, t.getKey())),
        //                 false
        //             )
        //         );
        //     }
        //     // var oBindingParams = oEvent.getParameter("bindingParams");

        //     // var aFinalFilters = [];

        //     // // Apply MultiComboBox: ID
        //     // var aSelectedIDs = this.byId("idFilterMCB").getSelectedKeys();
        //     // if (aSelectedIDs.length) {
        //     //     aFinalFilters.push(
        //     //         new sap.ui.model.Filter(
        //     //             aSelectedIDs.map(id => new Filter("ID", FilterOperator.EQ, id)),
        //     //             false // OR
        //     //         )
        //     //     );
        //     // }

        //     // // Apply MultiComboBox: Name
        //     // var aSelectedNames = this.byId("nameFilterMCB").getSelectedKeys();
        //     // if (aSelectedNames.length) {
        //     //     aFinalFilters.push(
        //     //         new sap.ui.model.Filter(
        //     //             aSelectedNames.map(name => new Filter("Name", FilterOperator.EQ, name)),
        //     //             false
        //     //         )
        //     //     );
        //     // }

        //     // // Apply Global Search filter (your existing logic)
        //     // if (this.filters && this.filters.length) {
        //     //     aFinalFilters.push(this.filters);
        //     // }

        //     // // Apply all filters with AND condition
        //     // if (aFinalFilters.length) {
        //     //     oBindingParams.filters = [new sap.ui.model.Filter(aFinalFilters, true)];
        //     // }
        // },
        onBeforeRebindTable: function (oEvent) {
            var oBindingParams = oEvent.getParameter("bindingParams");

            // This will collect ALL filter groups
            var aFilters = [];


            // GLOBAL SEARCH (this.filters = OR filter object)

            if (this.filters instanceof sap.ui.model.Filter) {
                aFilters.push(this.filters);   // push OR group
            }


            // MultiInput → Supplier ID tokens

            var aIdTokens = this.byId("supplierIdFilterId").getTokens();
            if (aIdTokens.length) {

                var aIdOR = aIdTokens.map(t =>
                    new Filter("ID", FilterOperator.EQ, t.getKey())
                );

                // OR group for ID
                aFilters.push(new Filter(aIdOR, false));
            }


            //  MultiInput → Supplier Name tokens

            var aNameTokens = this.byId("supplierNameFilterId").getTokens();
            if (aNameTokens.length) {

                var aNameOR = aNameTokens.map(t =>
                    new Filter("Name", FilterOperator.EQ, t.getKey())
                );

                // OR group for Name
                aFilters.push(new Filter(aNameOR, false));
            }


            //APPLY ALL FILTER GROUPS WITH AND

            if (aFilters.length) {
                oBindingParams.filters = [
                    new Filter(aFilters, true)   // AND
                ];
            }
        },
        // Helper method for clarity
        onTableUpdateFinished: function (oEvent) {
            debugger;
            var iRowCount = oEvent.getParameter("total");
            var oEditButton = this.getView().byId("editSupplierButtonId");
            var oDeleteButton = this.getView().byId("deleteSupplierButtonId");

            oEditButton.setVisible(iRowCount > 0);
            oEditButton.setEnabled(iRowCount > 0);

            oDeleteButton.setVisible(iRowCount > 0);
            oDeleteButton.setEnabled(iRowCount > 0);
        },
        // On Press Row navigates to Object Page with choosen Supplier details
        onSupplierPress: function (oEvent) {
            debugger;
            var oItem = oEvent.getSource();
            var oContext = oItem.getBindingContext();
            var sSupplierID = oContext.getProperty("ID");

            // navigate to Object Page
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.navTo("ObjectPage", { supplierId: sSupplierID });
        },
        //function declarations
        openAddEditSupplierFragment: function () {
            //checks if fragment already exists
            if (!this.oAddSupplierFragment) {
                //creates the fragment
                this.oAddSupplierFragment = new sap.ui.xmlfragment("com.dp.zsalesordercrud.view.fragments.addSupplier", this);
                this.oAddSupplierFragment.setModel(this.oModel); //Attach OData Model to fragment
                this.getView().addDependent(this.oAddSupplierFragment);
            }
            //reset form before opening
            sap.ui.getCore().byId("supplierId").setValue("");
            sap.ui.getCore().byId("supplierNameId").setValue("");
            sap.ui.getCore().byId("supplierStreetId").setValue("");
            sap.ui.getCore().byId("supplierCityId").setValue("");
            sap.ui.getCore().byId("supplierStateId").setValue("");
            sap.ui.getCore().byId("supplierCountryId").setValue("");
            sap.ui.getCore().byId("supplierConcurrencyId").setValue("");
            sap.ui.getCore().byId("supplierZipCodeId").setValue("");

            //Disables Save Button as NO DATA in form
            sap.ui.getCore().byId("saveButtonId").setEnabled(false);


            this.oAddSupplierFragment.open();

            // this.enableDisableProductsForm();
        },
        onMCBFilterChange: function () {
            this.byId("suppliersSmartTableId").rebindTable();
        },
        // enableDisableProductsForm: function(){

        // },
        // onPressAddNewProductFromSupplierFragment: function () {
        //     debugger;
        //     //show add product form
        //     sap.ui.getCore().byId("addProductFormId").setVisible(true);
        //     //hide choose product form
        //     sap.ui.getCore().byId("productSelectFormId").setVisible(false);

        //     sap.ui.getCore().byId("addSupplierDialog").setTitle("Add Supplier & Product");
        // },
        // onPressBackToProductSelect: function () {
        //     debugger;
        //     //show add product form
        //     sap.ui.getCore().byId("addProductFormId").setVisible(false);
        //     //hide choose product form
        //     sap.ui.getCore().byId("productSelectFormId").setVisible(true);

        //     sap.ui.getCore().byId("addSupplierDialog").setTitle("Add Supplier");
        //     sap.ui.getCore().byId("productComboBoxId").setValue("");
        //     sap.ui.getCore().byId("productComboBoxId").setSelectedKey("");
        // },
        getSupplierFormValues: function () {
            return {
                supplierId: parseInt(sap.ui.getCore().byId("supplierId").getValue().trim()),
                supplierName: sap.ui.getCore().byId("supplierNameId").getValue().trim(),
                supplierStreet: sap.ui.getCore().byId("supplierStreetId").getValue().trim(),
                supplierCity: sap.ui.getCore().byId("supplierCityId").getValue().trim(),
                supplierState: sap.ui.getCore().byId("supplierStateId").getValue().trim(),
                supplierZipCode: sap.ui.getCore().byId("supplierZipCodeId").getValue().trim(),
                supplierCountry: sap.ui.getCore().byId("supplierCountryId").getValue().trim(),
                supplierConcurrency: sap.ui.getCore().byId("supplierConcurrencyId").getValue().trim()
            }
        },
        //this function is called when user makes any change in the Supplier Form in UI
        onSupplierFormValueChange: function () {
            debugger;
            //reads form data
            var oSupplierFormValue = this.getSupplierFormValues();

            // enable if at least one field is non-empty
            var bEnable = !!(!isNaN(oSupplierFormValue.supplierId) || oSupplierFormValue.supplierName || oSupplierFormValue.supplierStreet
                || oSupplierFormValue.supplierCity || oSupplierFormValue.supplierState || oSupplierFormValue.supplierZipCode ||
                oSupplierFormValue.supplierCountry
            );

            if (bEnable === true) {
                sap.ui.getCore().byId("saveButtonId").setEnabled(true);
            } else {
                sap.ui.getCore().byId("saveButtonId").setEnabled(false);
            }
        },

        //function calls
        // On Press +, Opens Add supplier fragment
        onPressAddSupplier: function () {
            this.supplierMode = "add";
            this.openAddEditSupplierFragment();
        },
        onPressEditSupplier: function () {
            var oSmartTable = this.getView().byId("suppliersSmartTableId");
            var oInnerTable = oSmartTable.getTable();
            var aSelectedItems = oInnerTable.getSelectedItems();

            // Case 1: No selection
            if (aSelectedItems.length === 0) {
                sap.m.MessageToast.show("Please select a supplier to edit.");
                return;
            }

            // Case 2: Multiple selections
            if (aSelectedItems.length > 1) {
                sap.m.MessageToast.show("You can edit only one supplier at a time.");
                return;
            }

            // Case 3: Exactly one row selected
            var oSelectedItem = aSelectedItems[0];
            var sPath = oSelectedItem.getBindingContext().getPath(); // e.g. /Suppliers(0)
            this.oSelectedRowPath = sPath;

            // Read data directly from model (always fresh)
            var oModel = this.getView().getModel();
            var that = this;

            oModel.read(sPath, {
                success: function (oData) {
                    that.supplierMode = "edit";
                    that.openAddEditSupplierFragment();

                    // Set values in fragment fields
                    sap.ui.getCore().byId("supplierId").setValue(oData.ID);
                    sap.ui.getCore().byId("supplierNameId").setValue(oData.Name);
                    sap.ui.getCore().byId("supplierStreetId").setValue(oData.Address.Street);
                    sap.ui.getCore().byId("supplierCityId").setValue(oData.Address.City);
                    sap.ui.getCore().byId("supplierStateId").setValue(oData.Address.State);
                    sap.ui.getCore().byId("supplierZipCodeId").setValue(oData.Address.ZipCode);
                    sap.ui.getCore().byId("supplierCountryId").setValue(oData.Address.Country);
                    sap.ui.getCore().byId("supplierConcurrencyId").setValue(oData.Concurrency);

                    // Make ID non-editable, enable Save
                    sap.ui.getCore().byId("supplierId").setEnabled(false);
                    sap.ui.getCore().byId("saveButtonId").setEnabled(true);
                },
                error: function () {
                    sap.m.MessageToast.show("Failed to read supplier details from backend.");
                }
            });

        },
        validateSupplierForm: function () {
            var bIdValid = sap.ui.getCore().byId("supplierId").getValueState() !== "Error"
                && sap.ui.getCore().byId("supplierId").getValue().trim() !== "";

            var bNameValid = sap.ui.getCore().byId("supplierNameId").getValueState() !== "Error";
            var bStreetValid = sap.ui.getCore().byId("supplierStreetId").getValueState() !== "Error";
            var bCityValid = sap.ui.getCore().byId("supplierCityId").getValueState() !== "Error";
            var bStateValid = sap.ui.getCore().byId("supplierStateId").getValueState() !== "Error";
            var bZipValid = sap.ui.getCore().byId("supplierZipCodeId").getValueState() !== "Error";
            var bCountryValid = sap.ui.getCore().byId("supplierCountryId").getValueState() !== "Error";
            var bConcurrencyValid = sap.ui.getCore().byId("supplierConcurrencyId").getValueState() !== "Error";

            return (bIdValid && bNameValid && bStreetValid && bCityValid &&
                bStateValid && bZipValid && bCountryValid && bConcurrencyValid);
        },
        onPressSaveSupplier: function () {
            debugger;
            this.onValidateSupplierId();
            this.onValidateSupplierName();
            this.onValidateSupplierStreet();
            this.onValidateSupplierCity();
            this.onValidateSupplierState();
            this.onValidateSupplierZipCode();
            this.onValidateSupplierCountry();
            this.onValidateSupplierConcurrency();
            // VALIDATION CHECK (works for both add & edit)
            if (!this.validateSupplierForm()) {
                MessageBox.error("Please correct the highlighted fields before saving.");
                return;
            }
            var that = this;
            var oSupplierFormValue = this.getSupplierFormValues();
            var oSupplierPayload = {
                "ID": oSupplierFormValue.supplierId,
                "Name": oSupplierFormValue.supplierName,
                "Concurrency": parseInt(oSupplierFormValue.supplierConcurrency),
                "Address": {
                    "Street": oSupplierFormValue.supplierStreet,
                    "City": oSupplierFormValue.supplierCity,
                    "State": oSupplierFormValue.supplierState,
                    "ZipCode": oSupplierFormValue.supplierZipCode,
                    "Country": oSupplierFormValue.supplierCountry
                }

            }

            //add(create) or edit(update) based on - "this.supplierMode" flag
            if (this.supplierMode === "add") {
                //check for duplicate supplier id before pushing to model
                //for that read call must be made explicitily instead of getData() on model
                this.oModel.read("/Suppliers", {
                    success: function (oData) {
                        var aData = oData.results || [];

                        //now check for duplicates
                        var bIsSupplierDuplicate = aData.some(oItem => {
                            //when not using getFormValues()
                            // return oItem.ID === parseInt(iSupplierId);

                            return oItem.ID === oSupplierFormValue.supplierId;
                        });

                        //if found
                        if (bIsSupplierDuplicate) {
                            //when not using getFormValues()
                            // MessageBox.error("Product with ID " + iProductId + " already exists!");

                            MessageBox.error("Supplier with ID " + oSupplierFormValue.supplierId + " already exists!");
                            sap.ui.getCore().byId("supplierId").setValueState("Error");
                        } else {
                            sap.ui.getCore().byId("supplierId").setValueState("Error");
                            //push payload to model
                            //add mode
                            that.oModel.create("/Suppliers", oSupplierPayload, {
                                success: function () {
                                    MessageToast.show("Supplier added successfully");
                                    that.oAddSupplierFragment.close();
                                    that.oAddSupplierFragment.destroy();
                                    that.oAddSupplierFragment = null;
                                    that.supplierMode = "";
                                },
                                error: function (oError) {
                                    MessageToast.show(oError);
                                }
                            });
                        }
                    },
                    error: function (oError) {
                        MessageToast.show("Failed to read service - " + oError);
                    }
                });
            } else if (this.supplierMode === "edit") {
                //edit mode
                this.oModel.update(this.oSelectedRowPath, oSupplierPayload, {
                    success: function () {
                        MessageToast.show("Supplier editted successfully");
                        that.oAddSupplierFragment.close();
                        that.oAddSupplierFragment.destroy();
                        that.oAddSupplierFragment = null;
                        that.supplierMode = "";
                        that.getView().byId("responsiveTableId").removeSelections(true);
                    },
                    error: function (oError) {
                        MessageToast.show(oError);
                    }
                });
            }
        },
        onPressCancelSupplier: function () {
            debugger;
            var that = this;

            //check if add supplier form has data
            var oSupplierFormValue = this.getSupplierFormValues();

            //boolean value will be true if any of the condition returns true
            var bSupplierFormHasData = !isNaN(oSupplierFormValue.supplierId) || oSupplierFormValue.supplierName !== "" ||
                oSupplierFormValue.supplierStreet !== "" || oSupplierFormValue.supplierCity !== "" ||
                oSupplierFormValue.supplierState !== "" || oSupplierFormValue.supplierZipCode !== "" ||
                oSupplierFormValue.supplierCountry !== "" || oSupplierFormValue.supplierConcurrency === 4

            //if supplier form has data
            if (bSupplierFormHasData) {
                MessageBox.confirm("You have unsaved data! Do you really want to close?", {
                    actions: ["OK", "Cancel"],
                    emphasizedAction: "Cancel",
                    onClose: function (oAction) {
                        if (oAction == "OK") {
                            that.oAddSupplierFragment.close();
                            that.oAddSupplierFragment.destroy();
                            that.oAddSupplierFragment = null;
                            that.supplierMode = "";
                        } else {
                            MessageToast.show("You can continue editing!");
                        }
                    }
                })
            }
            //form has no data - safe to close without any warnings
            else {
                this.oAddSupplierFragment.close();
                this.oAddSupplierFragment.destroy();
                this.oAddSupplierFragment = null;
                this.supplierMode = "";
            }
        },
        onPressDeleteSupplier: function () {
            var that = this;
            var oSmartTable = this.getView().byId("suppliersSmartTableId");
            var oInnerTable = oSmartTable.getTable();
            var aSelectedItems = oInnerTable.getSelectedItems();
            var aSelectedItemsLength = aSelectedItems.length;

            // Case 1: No selection
            if (aSelectedItemsLength === 0) {
                sap.m.MessageToast.show("Please select a supplier to delete.");
                return;
            }

            // Case 2: Single Selection or Multiple selections
            if (aSelectedItemsLength >= 1) {
                MessageBox.confirm(aSelectedItemsLength > 1 ? "Are you sure you want to delete all records?" :
                    "Are you sure you want to delete selected record?", {
                    onClose: function (oAction) {
                        if (oAction === "OK") {
                            // Loop through selected items
                            aSelectedItems.forEach(function (oItem) {
                                var sPath = oItem.getBindingContext().getPath(); // "/Suppliers('1')"
                                that.oModel.remove(sPath, {
                                    success: function () {
                                        sap.m.MessageToast.show("Supplier deleted successfully.");
                                    },
                                    error: function () {
                                        sap.m.MessageToast.show("Failed to delete supplier.");
                                    }
                                });
                            });


                        }
                        that.oModel.refresh(true);
                        oInnerTable.removeSelections(true);
                    }
                });
            }
        },

        //validations
        onValidateSupplierId: function () {
            this.regExpId = /^[0-9]*$/;
            var id = sap.ui.getCore().byId("supplierId").getValue();
            if (id.match(this.regExpId) && id !== "") {
                sap.ui.getCore().byId("supplierId").setValueState("None");
            } else {
                sap.ui.getCore().byId("supplierId").setValueState("Error");
                sap.ui.getCore().byId("supplierId").setValueStateText("Id accepts numbers only");
            }
        },
        onValidateSupplierName: function () {
            this.regExpName = /^[A-za-z\s]+$/;
            var name = sap.ui.getCore().byId("supplierNameId").getValue();
            if (name.match(this.regExpName) && name !== "") {
                sap.ui.getCore().byId("supplierNameId").setValueState("None");
            } else {
                sap.ui.getCore().byId("supplierNameId").setValueState("Error");
                sap.ui.getCore().byId("supplierNameId").setValueStateText("Name accepts alphabets only");
            }
        },
        onValidateSupplierStreet: function () {
            this.regExpStreet = /^[A-Za-z0-9\s.\-\/:]*$/;
            var street = sap.ui.getCore().byId("supplierStreetId").getValue();
            if (street.match(this.regExpStreet) && street !== "") {
                sap.ui.getCore().byId("supplierStreetId").setValueState("None");
            } else {
                sap.ui.getCore().byId("supplierStreetId").setValueState("Error");
                sap.ui.getCore().byId("supplierStreetId").setValueStateText("Street contains invalid characters");
            }
        },
        onValidateSupplierCity: function () {
            this.regExpCity = /^[A-Za-z\s]*$/;
            var city = sap.ui.getCore().byId("supplierCityId").getValue();
            if (city.match(this.regExpCity) && city !== "") {
                sap.ui.getCore().byId("supplierCityId").setValueState("None");
            } else {
                sap.ui.getCore().byId("supplierCityId").setValueState("Error");
                sap.ui.getCore().byId("supplierCityId").setValueStateText("City accepts alphabets only");
            }
        },
        onValidateSupplierState: function () {
            this.regExpState = /^[A-Za-z\s]*$/;
            var state = sap.ui.getCore().byId("supplierStateId").getValue();
            if (state.match(this.regExpState) && state !== "") {
                sap.ui.getCore().byId("supplierStateId").setValueState("None");
            } else {
                sap.ui.getCore().byId("supplierStateId").setValueState("Error");
                sap.ui.getCore().byId("supplierStateId").setValueStateText("State accepts alphabets only");
            }
        },
        onValidateSupplierZipCode: function () {
            this.regExpZip = /^[0-9]{5,10}$/;
            var zip = sap.ui.getCore().byId("supplierZipCodeId").getValue();
            if (zip.match(this.regExpZip) && zip !== "") {
                sap.ui.getCore().byId("supplierZipCodeId").setValueState("None");
            } else {
                sap.ui.getCore().byId("supplierZipCodeId").setValueState("Error");
                sap.ui.getCore().byId("supplierZipCodeId").setValueStateText("Zip Code must be 5–10 digits");
            }
        },
        onValidateSupplierCountry: function () {
            this.regExpCountry = /^[A-Za-z\s]*$/;
            var country = sap.ui.getCore().byId("supplierCountryId").getValue();
            if (country.match(this.regExpCountry) && country !== "") {
                sap.ui.getCore().byId("supplierCountryId").setValueState("None");
            } else {
                sap.ui.getCore().byId("supplierCountryId").setValueState("Error");
                sap.ui.getCore().byId("supplierCountryId").setValueStateText("Country accepts alphabets only");
            }
        },
        onValidateSupplierConcurrency: function () {
            var concurrency = sap.ui.getCore().byId("supplierConcurrencyId").getValue();

            if (concurrency === "4" || concurrency === "0" || concurrency == "") {
                sap.ui.getCore().byId("supplierConcurrencyId").setValueState("None");
            } else {
                sap.ui.getCore().byId("supplierConcurrencyId").setValueState("Error");
                sap.ui.getCore().byId("supplierConcurrencyId").setValueStateText("Concurrency must always be 4");
            }
        }

    });
});