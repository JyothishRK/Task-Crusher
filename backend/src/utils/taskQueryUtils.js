/**
 * Utility functions for building MongoDB queries for task operations
 */

/**
 * Build MongoDB filter object for task queries
 * @param {Object} queryParams - Query parameters from request
 * @param {Object} additionalFilters - Additional filters to merge (e.g., userId, parentId)
 * @returns {Object} MongoDB filter object
 */
function buildTaskFilters(queryParams, additionalFilters = {}) {
    const match = { ...additionalFilters };
    
    // Filter by completion status
    if (queryParams.completed !== undefined) {
        match.isCompleted = queryParams.completed === "true";
    }
    
    // Filter by priority
    if (queryParams.priority) {
        match.priority = queryParams.priority;
    }
    
    // Filter by category
    if (queryParams.category) {
        match.category = queryParams.category;
    }
    
    return match;
}

/**
 * Build MongoDB sort criteria object
 * @param {string} sortBy - Sort parameter in format "field:direction" (e.g., "dueDate:asc")
 * @returns {Object} MongoDB sort object
 */
function buildSortCriteria(sortBy) {
    const sort = {};
    
    if (sortBy) {
        const parts = sortBy.split(":");
        sort[parts[0]] = (parts[1] === 'desc') ? -1 : 1;
    } else {
        // Default sort by due date ascending
        sort.dueDate = 1;
    }
    
    return sort;
}

/**
 * Extract pagination parameters from query
 * @param {Object} queryParams - Query parameters from request
 * @returns {Object} Object with limit and skip values
 */
function buildPaginationOptions(queryParams) {
    return {
        limit: parseInt(queryParams.limit) || 10,
        skip: parseInt(queryParams.skip) || 0
    };
}

module.exports = {
    buildTaskFilters,
    buildSortCriteria,
    buildPaginationOptions
};