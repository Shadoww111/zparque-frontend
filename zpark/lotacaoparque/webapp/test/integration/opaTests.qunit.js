sap.ui.require(
    [
        'sap/fe/test/JourneyRunner',
        'lotacaoparque/test/integration/FirstJourney',
		'lotacaoparque/test/integration/pages/DisponibilidadeList',
		'lotacaoparque/test/integration/pages/DisponibilidadeObjectPage'
    ],
    function(JourneyRunner, opaJourney, DisponibilidadeList, DisponibilidadeObjectPage) {
        'use strict';
        var JourneyRunner = new JourneyRunner({
            // start index.html in web folder
            launchUrl: sap.ui.require.toUrl('lotacaoparque') + '/index.html'
        });

       
        JourneyRunner.run(
            {
                pages: { 
					onTheDisponibilidadeList: DisponibilidadeList,
					onTheDisponibilidadeObjectPage: DisponibilidadeObjectPage
                }
            },
            opaJourney.run
        );
    }
);