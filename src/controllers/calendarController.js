const File = require('../models/File');
const Folder = require('../models/Folder');

// Filter files and folders by date range
exports.filterByDate = async (req, res) => {
    try {
        const { startDate, endDate, type } = req.query;
        const userId = req.user.id;

        // Validate required parameters
        if (!startDate || !endDate) {
            return res.status(400).json({ 
                success: false, 
                message: 'startDate and endDate are required query parameters' 
            });
        }

        // Validate date format
        const start = new Date(startDate);
        const end = new Date(endDate);

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid date format. Use YYYY-MM-DD or ISO format' 
            });
        }

        // Ensure start date is not after end date
        if (start > end) {
            return res.status(400).json({ 
                success: false, 
                message: 'startDate cannot be after endDate' 
            });
        }

        // Set end date to end of day
        end.setHours(23, 59, 59, 999);

        // Build query with user ownership (excluding safe files)
        const dateQuery = {
            userId: userId,
            createdAt: {
                $gte: start,
                $lte: end
            },
            $or: [
                { isSafe: { $exists: false } },
                { isSafe: false }
            ]
        };

        let files = [];
        let folders = [];

        // Filter by type if specified
        if (!type || type === 'files' || type === 'all') {
            files = await File.find(dateQuery)
                .select('name type size createdAt updatedAt isFavorite folderId')
                .sort({ createdAt: -1 });
        }

        if (!type || type === 'folders' || type === 'all') {
            folders = await Folder.find(dateQuery)
                .select('name storageUsed createdAt updatedAt items')
                .populate('items', 'name type')
                .sort({ createdAt: -1 });
        }

        res.status(200).json({ 
            success: true, 
            dateRange: {
                startDate: startDate,
                endDate: endDate,
                totalDays: Math.ceil((end - start) / (1000 * 60 * 60 * 24))
            },
            results: {
                files: {
                    count: files.length,
                    data: files
                },
                folders: {
                    count: folders.length,
                    data: folders
                },
                total: files.length + folders.length
            }
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'Server error', 
            error: error.message 
        });
    }
};

// Get activity summary for a specific date
exports.getDailyActivity = async (req, res) => {
    try {
        const { date } = req.query;
        const userId = req.user.id;

        if (!date) {
            return res.status(400).json({ 
                success: false, 
                message: 'date parameter is required (YYYY-MM-DD)' 
            });
        }

        const targetDate = new Date(date);
        if (isNaN(targetDate.getTime())) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid date format. Use YYYY-MM-DD' 
            });
        }

        // Set start and end of the day
        const startOfDay = new Date(targetDate);
        startOfDay.setHours(0, 0, 0, 0);
        
        const endOfDay = new Date(targetDate);
        endOfDay.setHours(23, 59, 59, 999);

        const dateQuery = {
            userId: userId,
            createdAt: {
                $gte: startOfDay,
                $lte: endOfDay
            },
            $or: [
                { isSafe: { $exists: false } },
                { isSafe: false }
            ]
        };

        const files = await File.find(dateQuery).select('name type size createdAt');
        const folders = await Folder.find(dateQuery).select('name storageUsed createdAt');

        // Calculate statistics
        const totalSize = files.reduce((sum, file) => sum + file.size, 0);
        const fileTypes = files.reduce((acc, file) => {
            acc[file.type] = (acc[file.type] || 0) + 1;
            return acc;
        }, {});

        res.status(200).json({
            success: true,
            date: date,
            activity: {
                files: {
                    count: files.length,
                    totalSize: totalSize,
                    totalSizeMB: Math.round((totalSize / (1024 * 1024)) * 100) / 100,
                    typeBreakdown: fileTypes,
                    data: files
                },
                folders: {
                    count: folders.length,
                    data: folders
                },
                summary: {
                    totalItems: files.length + folders.length,
                    totalStorageUsed: totalSize
                }
            }
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'Server error', 
            error: error.message 
        });
    }
};

// Get monthly activity summary
exports.getMonthlyActivity = async (req, res) => {
    try {
        const { year, month } = req.query;
        const userId = req.user.id;

        if (!year || !month) {
            return res.status(400).json({ 
                success: false, 
                message: 'year and month parameters are required' 
            });
        }

        const targetYear = parseInt(year);
        const targetMonth = parseInt(month);

        if (targetYear < 1900 || targetYear > 2100 || targetMonth < 1 || targetMonth > 12) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid year or month' 
            });
        }

        // Create start and end dates for the month
        const startOfMonth = new Date(targetYear, targetMonth - 1, 1);
        const endOfMonth = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999);

        const dateQuery = {
            userId: userId,
            createdAt: {
                $gte: startOfMonth,
                $lte: endOfMonth
            },
            $or: [
                { isSafe: { $exists: false } },
                { isSafe: false }
            ]
        };

        const files = await File.find(dateQuery).select('name type size createdAt');
        const folders = await Folder.find(dateQuery).select('name storageUsed createdAt');

        // Group by day
        const dailyActivity = {};
        
        files.forEach(file => {
            const day = file.createdAt.getDate();
            if (!dailyActivity[day]) {
                dailyActivity[day] = { files: 0, folders: 0, totalSize: 0 };
            }
            dailyActivity[day].files++;
            dailyActivity[day].totalSize += file.size;
        });

        folders.forEach(folder => {
            const day = folder.createdAt.getDate();
            if (!dailyActivity[day]) {
                dailyActivity[day] = { files: 0, folders: 0, totalSize: 0 };
            }
            dailyActivity[day].folders++;
        });

        res.status(200).json({
            success: true,
            period: {
                year: targetYear,
                month: targetMonth,
                monthName: startOfMonth.toLocaleString('default', { month: 'long' }),
                daysInMonth: endOfMonth.getDate()
            },
            summary: {
                totalFiles: files.length,
                totalFolders: folders.length,
                totalItems: files.length + folders.length,
                totalSize: files.reduce((sum, file) => sum + file.size, 0)
            },
            dailyActivity: dailyActivity
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'Server error', 
            error: error.message 
        });
    }
};

// Get recent activity (last N days)
exports.getRecentActivity = async (req, res) => {
    try {
        const { days = 7 } = req.query;
        const userId = req.user.id;

        const daysCount = parseInt(days);
        if (daysCount < 1 || daysCount > 365) {
            return res.status(400).json({ 
                success: false, 
                message: 'days parameter must be between 1 and 365' 
            });
        }

        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - daysCount);
        startDate.setHours(0, 0, 0, 0);

        const dateQuery = {
            userId: userId,
            createdAt: {
                $gte: startDate,
                $lte: endDate
            },
            $or: [
                { isSafe: { $exists: false } },
                { isSafe: false }
            ]
        };

        const files = await File.find(dateQuery)
            .select('name type size createdAt')
            .sort({ createdAt: -1 });
            
        const folders = await Folder.find(dateQuery)
            .select('name storageUsed createdAt')
            .sort({ createdAt: -1 });

        // Combine and sort by creation date
        const allItems = [
            ...files.map(file => ({ ...file.toObject(), itemType: 'File' })),
            ...folders.map(folder => ({ ...folder.toObject(), itemType: 'Folder' }))
        ].sort((a, b) => b.createdAt - a.createdAt);

        res.status(200).json({
            success: true,
            period: {
                days: daysCount,
                startDate: startDate.toISOString().split('T')[0],
                endDate: endDate.toISOString().split('T')[0]
            },
            summary: {
                totalFiles: files.length,
                totalFolders: folders.length,
                totalItems: allItems.length
            },
            recentActivity: allItems.slice(0, 50) // Limit to 50 most recent items
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'Server error', 
            error: error.message 
        });
    }
};
