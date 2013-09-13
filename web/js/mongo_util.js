/**
 * Created with IntelliJ IDEA.
 * User: duffp
 * Date: 9/13/13
 * Time: 12:02 PM
 * To change this template use File | Settings | File Templates.
 */
/**
 * Produces a hash code for the given string.
 * @param s
 * @returns {Object}
 */
function hash(s)
{
    return s.split("").reduce(function(a,b){a=((a<<5)-a)+b.charCodeAt(0);return a&a},0);
}

/**
 * Gets attribute names for the given object sorted alphabetically
 * in an array.
 * @param object
 * @returns Array of strings sorted alphabetically.
 */
function getSortedAttrNames(object)
{
    var attrNames = new Array();
    for (var key in object)
    {
        attrNames.push(key);
    }

    // sort by key name alphabetically
    attrNames.sort(function(a,b) { return a.localeCompare(b) } );

    return attrNames;
}

function SortByName(a, b)
{
    var aName = a.toLowerCase();
    var bName = b.toLowerCase();
    return ((aName < bName) ? -1 : ((aName > bName) ? 1 : 0));
}

function S4()
{
    return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
}
/**
 * Generates a GUID.
 * @returns {string}
 */
function guid()
{
    return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
}
