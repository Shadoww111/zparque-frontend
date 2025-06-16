sap.ui.require(
    [
        'sap/fe/test/JourneyRunner',
        'tipocliente/test/integration/FirstJourney',
		'tipocliente/test/integration/pages/TipoClienteList',
		'tipocliente/test/integration/pages/TipoClienteObjectPage'
    ],
    function(JourneyRunner, opaJourney, TipoClienteList, TipoClienteObjectPage) {
        'use strict';
        var JourneyRunner = new JourneyRunner({
            // start index.html in web folder
            launchUrl: sap.ui.require.toUrl('tipocliente') + '/index.html'
        });

       
        JourneyRunner.run(
            {
                pages: { 
					onTheTipoClienteList: TipoClienteList,
					onTheTipoClienteObjectPage: TipoClienteObjectPage
                }
            },
            opaJourney.run
        );
    }
);