sap.ui.require(
    [
        'sap/fe/test/JourneyRunner',
        'saida/test/integration/FirstJourney',
		'saida/test/integration/pages/SaidaList',
		'saida/test/integration/pages/SaidaObjectPage'
    ],
    function(JourneyRunner, opaJourney, SaidaList, SaidaObjectPage) {
        'use strict';
        var JourneyRunner = new JourneyRunner({
            // start index.html in web folder
            launchUrl: sap.ui.require.toUrl('saida') + '/index.html'
        });

       
        JourneyRunner.run(
            {
                pages: { 
					onTheSaidaList: SaidaList,
					onTheSaidaObjectPage: SaidaObjectPage
                }
            },
            opaJourney.run
        );
    }
);