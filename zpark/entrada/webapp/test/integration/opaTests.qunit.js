sap.ui.require(
    [
        'sap/fe/test/JourneyRunner',
        'entrada/test/integration/FirstJourney',
		'entrada/test/integration/pages/EntradaList',
		'entrada/test/integration/pages/EntradaObjectPage'
    ],
    function(JourneyRunner, opaJourney, EntradaList, EntradaObjectPage) {
        'use strict';
        var JourneyRunner = new JourneyRunner({
            // start index.html in web folder
            launchUrl: sap.ui.require.toUrl('entrada') + '/index.html'
        });

       
        JourneyRunner.run(
            {
                pages: { 
					onTheEntradaList: EntradaList,
					onTheEntradaObjectPage: EntradaObjectPage
                }
            },
            opaJourney.run
        );
    }
);