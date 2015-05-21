package edu.mayo.query;

import com.mongodb.BasicDBList;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;
import edu.mayo.ve.message.Querry;
import edu.mayo.ve.message.SampleGroup;

import java.util.ArrayList;
import java.util.List;

public class QueryBuilder {

    private enum Zygosity { HETEROZYGOUS, HOMOZYGOUS, EITHER };

    /**
     *
     * Translates a {@link Querry} into an Aggregation Pipeline.
     *
     * NOTE: The documents are not limited in any way.  This is done so that other downstream logic can optionally
     * add a $limit stage if it makes sense.
     *
     * @param q
     *      The {@link Querry} object that captures the query state to be translated.
     * @return
     *      A list of {@link DBObject}, each representing a stage of the Aggregation Pipeline.
     */
    public static List<DBObject> buildAggregationPipeline(Querry q) {
        List<DBObject> stages = new ArrayList<DBObject>();

        // stage that wraps the original find() query
        stages.add(buildWrapInMatchStage(q));

        // add sample group stages
        for (SampleGroup grp: q.getSampleGroups()) {

            Zygosity zygosity;
            if (grp.getZygosity().equals("heterozygous")) {
                zygosity = Zygosity.HETEROZYGOUS;
            }
            if (grp.getZygosity().equals("homozygous")) {
                zygosity = Zygosity.HOMOZYGOUS;
            }
            else {
                zygosity = Zygosity.EITHER;
            }

            // stage that looks for AT LEAST 1 match
            stages.add(buildMatchAtLeast1Stage(zygosity, grp.getSamples(), grp.isInSample()));

            // stage that checks the sample matches OR non-matches meets the criteria
            stages.add(buildCheckSamplesStage(zygosity, grp.getSamples(), grp.getMinMatchingSamplesInVariant(), grp.isInSample()));
        }

        return stages;
    }

    /**
     * Builds stage that takes the query created from {@link edu.mayo.ve.message.Querry#createQuery()} and
     * wraps it into a $match stage.
     *
     * @return An Aggregation Pipeline stage.
     */
    private static DBObject buildWrapInMatchStage(Querry q) {
        DBObject query = q.createQuery();

        DBObject matchStage = new BasicDBObject("$match", query);

        return matchStage;
    }

    /**
     * match variants where at least 1 sample from group matches
     * a sample in the current variant's HET/HOM array
     *
     * Example for zygosity=homozygous, group={A,B}, inSample=true:
     * <code>
     *
     * {
     *     $match: {
     *         $or: [ {"FORMAT.HomozygousList": "A"}, {"FORMAT.HomozygousList": "B"} ]
     *     }
     * }
     *
     * </code>
     *
     * Example for zygosity=homozygous, group={A,B}, inSample=false:
     * <code>
     *
     * {
     *     $match: {
     *         $or: [ {"FORMAT.HomozygousList": {"$nin": ["A"]}}, {"FORMAT.HomozygousList": {"$nin": ["B"]}} ]
     *     }
     * }
     *
     * </code>
     *
     * @param zygosity The {@link Zygosity} setting for the sample group.
     * @param sampleNames The samples that are part of the sample group.
     * @param inSample TRUE indicates "Sample in Group" and FALSE indicates "Sample Not In Group".
     * @return An Aggregation Pipeline stage.
     */
    private static DBObject buildMatchAtLeast1Stage(Zygosity zygosity, List<String> sampleNames, boolean inSample) {

        BasicDBObject query;

        // dynamically build OR clause
        // inSample=true,  AT LEAST 1 sample from the group should be in the HOM/HET/POS array
        // inSample=false, AT LEAST 1 sample from the group should NOT be in the HOM/HET/POS array
        BasicDBList orClauseArray = new BasicDBList();

        for (String sample: sampleNames) {
            switch (zygosity) {
                case HETEROZYGOUS:
                    orClauseArray.add(buildArrayCheckClause(inSample, "FORMAT.HeterozygousList", sample));
                    break;
                case HOMOZYGOUS:
                    orClauseArray.add(buildArrayCheckClause(inSample, "FORMAT.HomozygousList", sample));
                    break;
                case EITHER:
                    orClauseArray.add(buildArrayCheckClause(inSample, "FORMAT.GenotypePositiveList", sample));
                    break;
            }
        }

        query = new BasicDBObject("$or", orClauseArray);


        DBObject matchStage = new BasicDBObject("$match", query);

        return matchStage;
    }

    /**
     * Helper to build a clause that checks whether the given value is IN or NOT IN the specified array.
     *
     * @param inArray True if the given value should be IN the array.  False if the value should NOT be in the array.
     * @param jsonArrayField The JSON array field to be checked.
     * @param value The value to check against the array.
     * @return The clause.
     */
    private static DBObject buildArrayCheckClause(boolean inArray, String jsonArrayField, String value) {
        if (inArray) {
            // should be in the array
            return new BasicDBObject(jsonArrayField, value);
        } else {
            // should NOT be in the array
            BasicDBList ninArray = new BasicDBList();
            ninArray.add(value);
            return new BasicDBObject(jsonArrayField, new BasicDBObject("$nin", ninArray));
        }
    }

    /**
     * Keep only variant documents where # of missing samples <= inverseThreshold
     *
     * Example for zygosity=homozygous, group={A,B,C,D,E,F}, minMatches=4, inSample=true:
     * <code>
     *
     * {
     *     $redact: {
     *         $cond: {
     *             if: {
     *                 $lte: [{$size: {$setDifference: [["A","B","C","D","E","F"], "$FORMAT.HomozygousList"]}}, 2]
     *             },
     *             then: "$$KEEP",
     *             else: "$$PRUNE"
     *         }
     *     }
     * }
     *
     * </code>
     *
     * Example for zygosity=homozygous, group={A,B,C,D,E,F}, minMatches=4, inSample=false:
     * <code>
     *
     * {
     *     $redact: {
     *         $cond: {
     *             if: {
     *                 $gte: [{$size: {$setDifference: [["A","B","C","D","E","F"], "$FORMAT.HomozygousList"]}}, 4]
     *             },
     *             then: "$$KEEP",
     *             else: "$$PRUNE"
     *         }
     *     }
     * }
     *
     * </code>
     *
     * @param zygosity The {@link Zygosity} setting for the sample group.
     * @param sampleNames The samples that are part of the sample group.
     * @param minMatches The minimum # of sample matches between group and variant.
     * @param inSample TRUE indicates "Sample in Group" and FALSE indicates "Sample Not In Group".
     * @return An Aggregation Pipeline stage.
     */
    private static DBObject buildCheckSamplesStage(Zygosity zygosity, List<String> sampleNames, int minMatches, boolean inSample) {

        final int maxMisses = sampleNames.size() - minMatches;

        BasicDBList groupSampleSet = new BasicDBList();
        for (String sample: sampleNames) {
            groupSampleSet.add(sample);
        }

        BasicDBList setDiffArgs = new BasicDBList();
        setDiffArgs.add(groupSampleSet);
        switch (zygosity) {
            case HETEROZYGOUS:
                setDiffArgs.add("$FORMAT.HeterozygousList");
                break;
            case HOMOZYGOUS:
                setDiffArgs.add("$FORMAT.HomozygousList");
                break;
            case EITHER:
                setDiffArgs.add("$FORMAT.GenotypePositiveList");
                break;
        }

        DBObject missingSamples = new BasicDBObject("$setDifference", setDiffArgs);

        DBObject missingSampleCount = new BasicDBObject("$size", missingSamples);

        DBObject conditionalCheck;
        if (inSample) {
            // Looking at group samples IN the current variant
            // IF (# of missing samples) <= (maximum # of match misses between group and variant)
            BasicDBList ifCheckArgs = new BasicDBList();
            ifCheckArgs.add(missingSampleCount);
            ifCheckArgs.add(maxMisses);
            conditionalCheck = new BasicDBObject("$lte", ifCheckArgs);
        } else {
            // Looking at group samples NOT IN the current variant
            // IF (# of missing samples) >= (minimum # of matches between group and variant)
            BasicDBList ifCheckArgs = new BasicDBList();
            ifCheckArgs.add(missingSampleCount);
            ifCheckArgs.add(minMatches);
            conditionalCheck = new BasicDBObject("$gte", ifCheckArgs);
        }

        BasicDBObject conditionVal = new BasicDBObject();
        conditionVal.append("if",    conditionalCheck);
        conditionVal.append("then",  "$$KEEP");
        conditionVal.append("else", "$$PRUNE");

        DBObject condition = new BasicDBObject("$cond", conditionVal);

        DBObject redactStage = new BasicDBObject("$redact", condition);

        return redactStage;
    }
}
