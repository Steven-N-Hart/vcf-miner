var GeneFilterTab = function () {

    // private variables
    var workspaceKey;

    // initialize typeahead widget
    var geneTypeahead = $('#gene_typeahead').typeahead({
        source: new Array(),
        updater: function (selection)
        {
            $('#gene_list').append("<option value='"+selection+"'>"+selection+"</option>");
        }
    });


    $('#reset_gene_list').click(function (e)
    {
        $('#gene_list').empty();
    });

    // add custom validation method for the gene list to make sure at least 1 is there
    jQuery.validator.addMethod("checkGenes", function(value, element) {
        if ($('#gene_list option').length > 0)
        {
            return true;
        }
        else
        {
            return false;
        }
    }, "At least 1 Gene must be added");

    // jQuery validate plugin config
    $('#gene_tab_form').validate(
        {
            rules:
            {
                gene_list: {
                    checkGenes: true
                }
            },
            highlight: function(element) {
                $(element).parent().addClass('control-group error');
            },
            success: function(element) {
                $(element).parent().removeClass('control-group error');
            }
        }
    );


    function reset()
    {
        $('#gene_list').empty();

        $.ajax({
            type: "GET",
            url: "/mongo_svr/ve/gene/getGenes/w/" + workspaceKey,
            dataType: "json",
            success: function(json)
            {
                geneTypeahead.data('typeahead').source = json;
            },
            error: function(jqXHR, textStatus)
            {
                $("#message_area").html(_.template(ERROR_TEMPLATE,{message: JSON.stringify(jqXHR)}));
            }
        });
    }

    // public API
    return {
        /**
         * Resets the state of this tab.
         *
         * @param ws
         *      The workspace key.
         */
        initialize: function(ws)
        {
            workspaceKey = ws;
            reset();
        },

        /**
         * Performs validation on the user's current selections/entries.
         */
        validate: function()
        {
            return $('#gene_tab_form').valid();
        },

        /**
         * Gets the selected filter.
         *
         * @return Filter model
         */
        getFilter: function()
        {
            var filter = new Filter();
            filter.set("category", FilterCategory.GENE);
            filter.set("name", 'Gene');
            filter.set("operator", FilterOperator.EQ);

            var geneArray = new Array();
            $("#gene_list option").each(function()
            {
                var gene = $(this).val();
                geneArray.push(gene);
            });

            filter.set("value", geneArray);

            return filter;
        }

    };

};