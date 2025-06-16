sap.ui.require(
    [
        'sap/fe/test/JourneyRunner',
        'faturacao/test/integration/FirstJourney',
		'faturacao/test/integration/pages/FaturacaoAnaliseList',
		'faturacao/test/integration/pages/FaturacaoAnaliseObjectPage'
    ],
    function(JourneyRunner, opaJourney, FaturacaoAnaliseList, FaturacaoAnaliseObjectPage) {
        'use strict';
        var JourneyRunner = new JourneyRunner({
            // start index.html in web folder
            launchUrl: sap.ui.require.toUrl('faturacao') + '/index.html'
        });

       
        JourneyRunner.run(
            {
                pages: { 
					onTheFaturacaoAnaliseList: FaturacaoAnaliseList,
					onTheFaturacaoAnaliseObjectPage: FaturacaoAnaliseObjectPage
                }
            },
            opaJourney.run
        );
    }
);