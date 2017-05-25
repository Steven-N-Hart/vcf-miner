var GroupFilterGenotype =
{
    UNKNOWN:      0,
    EITHER:       1,
    HETEROZYGOUS: 2,
    HOMOZYGOUS:   3
}

// MODEL
var GroupFilter = Filter.extend({

    getValueAsHTML: function()
    {
        var sampleGroup = this.get("value");
        var sampleNames = sampleGroup.get("sampleNames");

        // setup string for tooltip
        var tooltipStr = sampleNames.length + ' Samples:\n';
        for (var i=0; i < sampleNames.length; i++) {
            tooltipStr += sampleNames[i];

            // append newline for all except last
            if (i < (sampleNames.length - 1)) {
                tooltipStr += '\n';
            }
        }

        var html = '<div class="text-left" title="'+tooltipStr+'">' + sampleGroup.get("name") + '</div>';
        html += '<div class="text-left"><i>genotype:'+this.toGenotypeString(this.get("genotype"))+'</i></div>';
        html += '<div class="text-left"><span style="white-space:nowrap;"><i>min # samples:'+this.get("atLeastXSamples")+'</i></span></div>';

        return html;
    },

    getValueAsASCII: function() {
        var sampleGroup = this.get("value");

        var ascii = sampleGroup.get("name");
        ascii += ' genotype:' + this.toGenotypeString(this.get("genotype"));
        ascii += ' min # samples:' + this.get("atLeastXSamples");

        return ascii;
    },

    toGenotypeString: function(genotype) {
        var genotypeStr;
        switch (genotype) {
            case GroupFilterGenotype.UNKNOWN:
                genotypeStr='?';
                break;
            case GroupFilterGenotype.EITHER:
                genotypeStr='either';
                break;
            case GroupFilterGenotype.HETEROZYGOUS:
                genotypeStr='heterozygous';
                break;
            case GroupFilterGenotype.HOMOZYGOUS:
                genotypeStr='homozygous';
                break;
        }
        return genotypeStr;
    },

    toSampleGroupPOJO: function(workspaceKey, inSample)
    {
        var sampleGroup = this.get("value");

        var pojo = {};
        pojo.workspace   = workspaceKey;
        pojo.alias       = sampleGroup.get("name");
        pojo.description = sampleGroup.get("description");
        pojo.samples     = sampleGroup.get("sampleNames");
        pojo.inSample    = inSample;

        var zygosity;
        switch(this.get("genotype")) {
            case GroupFilterGenotype.EITHER:
                zygosity = 'either';
                break;
            case GroupFilterGenotype.HETEROZYGOUS:
                zygosity = 'heterozygous';
                break;
            case GroupFilterGenotype.HOMOZYGOUS:
                zygosity = 'homozygous';
                break;
        }
        pojo.zygosity = zygosity;

        pojo.minMatchingSamplesInVariant = this.get("atLeastXSamples");

        return pojo;
    },

    /**
     * Translates server-side zygosity value into a GroupFilterGenotype.
     */
    toGenotype: function(zygosity)
    {
        var genotype = GroupFilterGenotype.UNKNOWN;

        switch (zygosity) {
            case 'either':
                genotype = GroupFilterGenotype.EITHER;
                break;
            case 'heterozygous':
                genotype = GroupFilterGenotype.HETEROZYGOUS;
                break;
            case 'homozygous':
                genotype = GroupFilterGenotype.HOMOZYGOUS;
                break;
        }

        return genotype;
    },

    defaults: function()
    {
        return {
            name:            "NA",
            displayName:     "NA",
            description:     "NA",
            operator:        FilterOperator.UNKNOWN,
            displayOperator: "NA",
            valueFunction:   FilterValueFunction.NONE,
            value:           null,
            displayValue:    "NA", // may be abbreviated
            numMatches:      0,
            category:        FilterCategory.UNKNOWN,
            id:              guid(),
            includeNulls:    false,
            removable:       false,
            genotype:        GroupFilterGenotype.UNKNOWN,
            atLeastXSamples: 0
        };
    }
});
