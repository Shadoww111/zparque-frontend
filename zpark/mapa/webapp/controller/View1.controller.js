sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/ui/core/format/DateFormat",
    "sap/ui/core/BusyIndicator"
], function (Controller, JSONModel, MessageToast, DateFormat, BusyIndicator) {
    "use strict";

    return Controller.extend("mapa.controller.View1", {
        onInit: function () {
            // Initialize the JSON model for parking availability
            var oDisponibilidadeModel = new JSONModel();
            this.getView().setModel(oDisponibilidadeModel, "disponibilidadeModel");
            
            // Load initial data
            this.loadDisponibilidadeData();
            
            // Set up auto refresh every 30 seconds
            this._refreshInterval = setInterval(function() {
                this.loadDisponibilidadeData();
            }.bind(this), 30000); // 30 seconds
        },
        
        onExit: function() {
            // Clear the refresh interval when the view is destroyed
            if (this._refreshInterval) {
                clearInterval(this._refreshInterval);
                this._refreshInterval = null;
            }
        },
        
        loadDisponibilidadeData: function() {
            var that = this;
            
            // Show loading indicator
            sap.ui.core.BusyIndicator.show(0);
            
            // Get the OData model
            var oModel = this.getOwnerComponent().getModel();
            
            // Create a list binding to the Disponibilidade entity set
            var oBinding = oModel.bindList("/Disponibilidade");
            
            // Execute the query
            oBinding.requestContexts().then(function(aContexts) {
                if (aContexts && aContexts.length > 0) {
                    // Get the data object from the first context
                    return aContexts[0].getObject();
                } else {
                    throw new Error("No data found");
                }
            }).then(function(oDisponibilidade) {
                // Add formatted timestamp
                var oDateFormat = DateFormat.getDateTimeInstance({
                    pattern: "MM/dd/yyyy, HH:mm:ss a"
                });
                oDisponibilidade.formattedTimestamp = oDateFormat.format(new Date());
                
                // Set data to model
                that.getView().getModel("disponibilidadeModel").setData(oDisponibilidade);
                
                // Render the parking map
                that.renderParkingMap();
                
                // Hide loading indicator
                sap.ui.core.BusyIndicator.hide();
                
                MessageToast.show("Parking data updated successfully");
            }).catch(function(oError) {
                // Log the error
                console.error("Error loading data:", oError);
                
                // Hide loading indicator
                sap.ui.core.BusyIndicator.hide();
                
                // Show error message
                MessageToast.show("Error loading parking data. Using demo data instead.");
                
                // Load mock data as fallback
                that.loadMockData();
            });
        },
        
        loadMockData: function() {
            // Mock data for testing when service is not available
            var oMockData = {
                "IdDisponibilidade": "1",
                "LugaresMotoTotal": 20,
                "LugaresMotoOcupados": 12,
                "LugaresMotoLivres": 8,
                "MotoOcupadosCriticality": 2,
                "MotoLivresCriticality": 2,
                "LugaresLigeiroTotal": 65,
                "LugaresLigeiroOcupados": 48,
                "LugaresLigeiroLivres": 17,
                "LigeiroOcupadosCriticality": 1,
                "LigeiroLivresCriticality": 2,
                "LugaresPesadoTotal": 15,
                "LugaresPesadoOcupados": 5,
                "LugaresPesadoLivres": 10,
                "PesadoOcupadosCriticality": 3,
                "PesadoLivresCriticality": 3,
                "formattedTimestamp": new Date().toLocaleString()
            };
            
            // Set mock data to model
            this.getView().getModel("disponibilidadeModel").setData(oMockData);
            
            // Render the parking map with mock data
            this.renderParkingMap();
        },
        
        renderParkingMap: function() {
            var oModel = this.getView().getModel("disponibilidadeModel");
            var oData = oModel.getData();
            
            if (!oData) {
                return;
            }
            
            var mapDiv = this.getView().byId("parkingMap").getDomRef();
            if (!mapDiv) {
                return;
            }
            
            // Clear previous content
            mapDiv.innerHTML = "";
            
            // Create SVG element for the parking map
            var svgNS = "http://www.w3.org/2000/svg";
            var svg = document.createElementNS(svgNS, "svg");
            svg.setAttribute("width", "800");
            svg.setAttribute("height", "500");
            svg.setAttribute("viewBox", "0 0 800 500");
            
            // Add background
            var background = document.createElementNS(svgNS, "rect");
            background.setAttribute("width", "800");
            background.setAttribute("height", "500");
            background.setAttribute("fill", "#f5f5f5");
            svg.appendChild(background);
            
            // Draw parking lot outline
            var outline = document.createElementNS(svgNS, "rect");
            outline.setAttribute("x", "50");
            outline.setAttribute("y", "50");
            outline.setAttribute("width", "700");
            outline.setAttribute("height", "400");
            outline.setAttribute("fill", "#ddd");
            outline.setAttribute("stroke", "#666");
            outline.setAttribute("stroke-width", "2");
            svg.appendChild(outline);
            
            // Draw entrance/exit
            var entrance = document.createElementNS(svgNS, "path");
            entrance.setAttribute("d", "M 400,450 L 400,500");
            entrance.setAttribute("stroke", "#333");
            entrance.setAttribute("stroke-width", "30");
            entrance.setAttribute("stroke-dasharray", "10,5");
            svg.appendChild(entrance);
            
            var entranceLabel = document.createElementNS(svgNS, "text");
            entranceLabel.setAttribute("x", "400");
            entranceLabel.setAttribute("y", "480");
            entranceLabel.setAttribute("text-anchor", "middle");
            entranceLabel.setAttribute("fill", "#fff");
            entranceLabel.setAttribute("font-weight", "bold");
            entranceLabel.textContent = "ENTRANCE/EXIT";
            svg.appendChild(entranceLabel);
            
            // Create zones for different vehicle types
            this.createParkingZone(svg, svgNS, "CARS", 100, 100, 500, 100, oData.LugaresLigeiroTotal, 
                                  oData.LugaresLigeiroOcupados, 60, 30, oData.LigeiroLivresCriticality);
            
            this.createParkingZone(svg, svgNS, "MOTORCYCLES", 100, 230, 200, 100, oData.LugaresMotoTotal, 
                                  oData.LugaresMotoOcupados, 40, 25, oData.MotoLivresCriticality);
            
            this.createParkingZone(svg, svgNS, "TRUCKS", 350, 230, 250, 150, oData.LugaresPesadoTotal, 
                                  oData.LugaresPesadoOcupados, 80, 40, oData.PesadoLivresCriticality);
            
            // Add decorative elements like trees and buildings
            this.addDecorativeElements(svg, svgNS);
            
            // Add legend
            var legend = document.createElementNS(svgNS, "text");
            legend.setAttribute("x", "50");
            legend.setAttribute("y", "30");
            legend.setAttribute("font-weight", "bold");
            legend.textContent = "CS4 PARKING MAP";
            svg.appendChild(legend);
            
            // Add the SVG to the DOM
            mapDiv.appendChild(svg);
        },
        
        createParkingZone: function(svg, svgNS, title, x, y, width, height, total, occupied, spotWidth, spotHeight, criticality) {
            // Create zone background
            var zone = document.createElementNS(svgNS, "rect");
            zone.setAttribute("x", x);
            zone.setAttribute("y", y);
            zone.setAttribute("width", width);
            zone.setAttribute("height", height);
            zone.setAttribute("fill", "#eee");
            zone.setAttribute("stroke", "#999");
            zone.setAttribute("stroke-width", "1");
            svg.appendChild(zone);
            
            // Add zone title
            var zoneTitle = document.createElementNS(svgNS, "text");
            zoneTitle.setAttribute("x", x + width/2);
            zoneTitle.setAttribute("y", y + 20);
            zoneTitle.setAttribute("text-anchor", "middle");
            zoneTitle.setAttribute("font-weight", "bold");
            zoneTitle.textContent = title;
            svg.appendChild(zoneTitle);
            
            // Calculate spots layout
            var spotsPerRow = Math.floor((width - 20) / (spotWidth + 5));
            var rows = Math.ceil(total / spotsPerRow);
            var spotColors = this.getSpotColors(criticality);
            
            // Draw parking spots
            for (var i = 0; i < total; i++) {
                var row = Math.floor(i / spotsPerRow);
                var col = i % spotsPerRow;
                
                var spotX = x + 10 + col * (spotWidth + 5);
                var spotY = y + 30 + row * (spotHeight + 5);
                
                var isOccupied = i < occupied;
                var spotColor = isOccupied ? "#b00" : spotColors.available;
                
                // For visual variety, make some spots "almost occupied" with warning color
                if (!isOccupied && i < occupied + Math.floor(total * 0.1) && criticality === 2) {
                    spotColor = spotColors.limited;
                }
                
                this.createParkingSpot(svg, svgNS, spotX, spotY, spotWidth, spotHeight, spotColor, title);
            }
            
            // Add occupancy text
            var occupancyText = document.createElementNS(svgNS, "text");
            occupancyText.setAttribute("x", x + width/2);
            occupancyText.setAttribute("y", y + height - 10);
            occupancyText.setAttribute("text-anchor", "middle");
            occupancyText.setAttribute("fill", this.getCriticalityColor(criticality));
            occupancyText.setAttribute("font-weight", "bold");
            occupancyText.textContent = occupied + "/" + total + " occupied";
            svg.appendChild(occupancyText);
        },
        
        createParkingSpot: function(svg, svgNS, x, y, width, height, color, type) {
            var spot = document.createElementNS(svgNS, "rect");
            spot.setAttribute("x", x);
            spot.setAttribute("y", y);
            spot.setAttribute("width", width);
            spot.setAttribute("height", height);
            spot.setAttribute("fill", color);
            spot.setAttribute("stroke", "#666");
            spot.setAttribute("stroke-width", "1");
            spot.setAttribute("rx", "3");
            spot.setAttribute("ry", "3");
            svg.appendChild(spot);
            
            // Add vehicle icon according to type
            var icon = document.createElementNS(svgNS, "text");
            icon.setAttribute("x", x + width/2);
            icon.setAttribute("y", y + height/2 + 5);
            icon.setAttribute("text-anchor", "middle");
            icon.setAttribute("font-family", "SAP-icons");
            icon.setAttribute("font-size", "14px");
            icon.setAttribute("fill", "#ffffff");
            
            // Set different icons for different vehicle types
            if (type === "CARS") {
                icon.textContent = "\ue16e"; // Car icon from SAP-icons
            } else if (type === "MOTORCYCLES") {
                icon.textContent = "\ue202"; // Different icon for motorcycles
            } else if (type === "TRUCKS") {
                icon.textContent = "\ue1e7"; // Different icon for trucks
            }
            
            svg.appendChild(icon);
            
            // Add random EV charging spots (just for visual purposes)
            if (Math.random() < 0.1 && color !== "#b00") {
                var evIcon = document.createElementNS(svgNS, "text");
                evIcon.setAttribute("x", x + width - 10);
                evIcon.setAttribute("y", y + 10);
                evIcon.setAttribute("text-anchor", "middle");
                evIcon.setAttribute("font-family", "SAP-icons");
                evIcon.setAttribute("font-size", "10px");
                evIcon.setAttribute("fill", "#0070f2");
                evIcon.textContent = "\ue25b"; // Electric charging icon
                svg.appendChild(evIcon);
            }
        },
        
        addDecorativeElements: function(svg, svgNS) {
            // Add trees
            this.createTree(svg, svgNS, 20, 20);
            this.createTree(svg, svgNS, 780, 20);
            this.createTree(svg, svgNS, 20, 480);
            this.createTree(svg, svgNS, 780, 480);
            
            // Add building/office
            var building = document.createElementNS(svgNS, "rect");
            building.setAttribute("x", "650");
            building.setAttribute("y", "380");
            building.setAttribute("width", "80");
            building.setAttribute("height", "50");
            building.setAttribute("fill", "#0070f2");
            building.setAttribute("stroke", "#333");
            building.setAttribute("stroke-width", "1");
            svg.appendChild(building);
            
            var buildingLabel = document.createElementNS(svgNS, "text");
            buildingLabel.setAttribute("x", "690");
            buildingLabel.setAttribute("y", "410");
            buildingLabel.setAttribute("text-anchor", "middle");
            buildingLabel.setAttribute("fill", "#fff");
            buildingLabel.setAttribute("font-weight", "bold");
            buildingLabel.textContent = "OFFICE";
            svg.appendChild(buildingLabel);
        },
        
        createTree: function(svg, svgNS, x, y) {
            var treeBase = document.createElementNS(svgNS, "rect");
            treeBase.setAttribute("x", x - 3);
            treeBase.setAttribute("y", y + 10);
            treeBase.setAttribute("width", "6");
            treeBase.setAttribute("height", "10");
            treeBase.setAttribute("fill", "#8B4513");
            svg.appendChild(treeBase);
            
            var treeCrown = document.createElementNS(svgNS, "circle");
            treeCrown.setAttribute("cx", x);
            treeCrown.setAttribute("cy", y);
            treeCrown.setAttribute("r", "10");
            treeCrown.setAttribute("fill", "#2e8b57");
            svg.appendChild(treeCrown);
        },
        
        getSpotColors: function(criticality) {
            var colors = {
                available: "#107e3e", // Green - Success
                limited: "#e9730c"    // Orange - Warning
            };
            
            return colors;
        },
        
        getCriticalityColor: function(criticality) {
            switch(criticality) {
                case 1: return "#b00";    // Error
                case 2: return "#e9730c"; // Warning
                case 3: return "#107e3e"; // Success
                default: return "#107e3e";
            }
        },
        
        onRefreshData: function() {
            this.loadDisponibilidadeData();
        }
    });
});