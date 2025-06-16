sap.ui.require(
    [
        'sap/fe/test/JourneyRunner',
        'gestaocliente/test/integration/FirstJourney',
		'gestaocliente/test/integration/pages/ClienteList',
		'gestaocliente/test/integration/pages/ClienteObjectPage',
		'gestaocliente/test/integration/pages/VeiculoObjectPage'
    ],
    function(JourneyRunner, opaJourney, ClienteList, ClienteObjectPage, VeiculoObjectPage) {
        'use strict';
        var JourneyRunner = new JourneyRunner({
            // start index.html in web folder
            launchUrl: sap.ui.require.toUrl('gestaocliente') + '/index.html'
        });

       
        JourneyRunner.run(
            {
                pages: { 
					onTheClienteList: ClienteList,
					onTheClienteObjectPage: ClienteObjectPage,
					onTheVeiculoObjectPage: VeiculoObjectPage
                }
            },
            opaJourney.run
        );
    }
);