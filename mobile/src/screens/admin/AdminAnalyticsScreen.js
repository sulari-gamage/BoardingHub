import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    ScrollView,
    StatusBar,
    Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AdminHeader from '../../components/AdminHeader';

export default function AdminAnalyticsScreen({
    onNavigateTab,
    onOpenNotifications,
    activeTab = 'Analytics'
}) {
    const metrics = [
        {
            id: 'users',
            label: 'TOTAL USERS',
            value: '14,205',
            trend: '+12.5%',
            trendLabel: 'vs last month',
            icon: 'people-outline',
            isPositive: true,
        },
        {
            id: 'revenue',
            label: 'MONTHLY REV',
            value: '$124.5k',
            trend: '+8.2%',
            trendLabel: 'vs last month',
            icon: 'cash-outline',
            isPositive: true,
        },
        {
            id: 'listings',
            label: 'ACTIVE LISTINGS',
            value: '3,842',
            trend: '0.0%',
            trendLabel: 'vs last month',
            icon: 'list-outline',
            isNeutral: true,
        },
        {
            id: 'conversion',
            label: 'CONVERSION',
            value: '4.2%',
            trend: '-1.1%',
            trendLabel: 'vs last month',
            icon: 'trending-up-outline',
            isNegative: true,
        }
    ];

    // User growth trend data points
    const growthPoints = [
        { month: 'Jan', val: '10,200', pct: 0 },
        { month: 'Feb', val: '11,500', pct: 30 },
        { month: 'Mar', val: '11,800', pct: 37 },
        { month: 'Apr', val: '12,400', pct: 52 },
        { month: 'May', val: '13,100', pct: 68 },
        { month: 'Jun', val: '13,800', pct: 84 },
        { month: 'Jul', val: '14,205', pct: 95 },
    ];

    // Stacked revenue chart data
    const revenueData = [
        { month: 'Jan', recurring: 65, transactional: 25 },
        { month: 'Feb', recurring: 68, transactional: 22 },
        { month: 'Mar', recurring: 72, transactional: 28 },
        { month: 'Apr', recurring: 75, transactional: 31 },
        { month: 'May', recurring: 80, transactional: 29 },
        { month: 'Jun', recurring: 85, transactional: 40 },
    ];

    return (
        <SafeAreaView style={styles.container}>
            <AdminHeader
                title="Platform Analytics"
                onOpenNotifications={onOpenNotifications}
                onOpenProfile={() => onNavigateTab && onNavigateTab('Users')}
            />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* 1. Page Header */}
                <View style={styles.titleSection}>
                    <Text style={styles.pageTitle}>Platform Analytics</Text>
                    <Text style={styles.pageSubtitle}>Last 30 Days Overview</Text>
                </View>

                {/* 2. 2x2 Metric Cards Grid */}
                <View style={styles.metricsGrid}>
                    {metrics.map((item) => (
                        <View key={item.id} style={styles.metricCard}>
                            <View style={styles.cardHeader}>
                                <Text style={styles.metricLabel}>{item.label}</Text>
                                <View style={styles.iconBox}>
                                    <Ionicons name={item.icon} size={16} color="#133E32" />
                                </View>
                            </View>

                            <Text style={styles.metricValue}>{item.value}</Text>

                            <View style={styles.trendRow}>
                                <Ionicons
                                    name={
                                        item.isNegative
                                            ? "trending-down-outline"
                                            : item.isNeutral
                                                ? "arrow-forward-outline"
                                                : "trending-up-outline"
                                    }
                                    size={12}
                                    color={item.isNegative ? "#DC2626" : item.isNeutral ? "#64748B" : "#133E32"}
                                    style={{ marginRight: 4 }}
                                />
                                <Text
                                    style={[
                                        styles.trendPct,
                                        item.isNegative && styles.trendPctNegative,
                                        item.isNeutral && styles.trendPctNeutral,
                                    ]}
                                >
                                    {item.trend}
                                </Text>
                                <Text style={styles.trendLabel}> {item.trendLabel}</Text>
                            </View>
                        </View>
                    ))}
                </View>

                {/* 3. User Growth Trend Card */}
                <View style={styles.sectionCard}>
                    <View style={styles.cardTitleHeader}>
                        <View>
                            <Text style={styles.cardTitle}>User Growth Trend</Text>
                            <Text style={styles.cardSubtitle}>Cumulative registered users over time</Text>
                        </View>
                        <TouchableOpacity style={styles.moreBtn} activeOpacity={0.7}>
                            <Ionicons name="ellipsis-vertical" size={18} color="#64748B" />
                        </TouchableOpacity>
                    </View>

                    {/* Chart Container */}
                    <View style={styles.lineChartWrapper}>
                        {/* Y-Axis Labels */}
                        <View style={styles.yAxisContainer}>
                            {['14,500', '14,000', '13,500', '13,000', '12,500', '12,000', '11,500', '11,000', '10,500', '10,000'].map((lbl, idx) => (
                                <Text key={idx} style={styles.axisLabel}>{lbl}</Text>
                            ))}
                        </View>

                        {/* Line Chart Plot Area */}
                        <View style={styles.plotArea}>
                            {/* Horizontal Grid lines */}
                            {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                                <View key={i} style={styles.gridLine} />
                            ))}

                            {/* Shaded Area Under Line */}
                            <View style={styles.shadeArea} />

                            {/* Connecting Line Plot Points */}
                            <View style={styles.pointsOverlay}>
                                {growthPoints.map((pt, idx) => (
                                    <View key={idx} style={[styles.pointItem, { bottom: `${pt.pct}%` }]}>
                                        <View style={styles.pointDot} />
                                    </View>
                                ))}
                            </View>
                        </View>
                    </View>

                    {/* X-Axis Month Labels */}
                    <View style={styles.xAxisRow}>
                        {growthPoints.map((pt, idx) => (
                            <Text key={idx} style={styles.xAxisLabel}>{pt.month}</Text>
                        ))}
                    </View>
                </View>

                {/* 4. Listing Distribution Card */}
                <View style={styles.sectionCard}>
                    <Text style={styles.cardTitle}>Listing Distribution</Text>
                    <Text style={styles.cardSubtitle}>Active listings by region</Text>

                    {/* Donut Chart Visualization */}
                    <View style={styles.donutWrapper}>
                        <View style={styles.outerDonut}>
                            <View style={styles.donutRing1} />
                            <View style={styles.donutRing2} />
                            <View style={styles.donutRing3} />
                            <View style={styles.innerDonutHole} />
                        </View>
                    </View>

                    {/* Region Legend Grid */}
                    <View style={styles.legendGrid}>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendDot, { backgroundColor: '#0B3B2C' }]} />
                            <Text style={styles.legendText}>North Region</Text>
                        </View>

                        <View style={styles.legendItem}>
                            <View style={[styles.legendDot, { backgroundColor: '#2A6B56' }]} />
                            <Text style={styles.legendText}>South District</Text>
                        </View>

                        <View style={styles.legendItem}>
                            <View style={[styles.legendDot, { backgroundColor: '#6FA893' }]} />
                            <Text style={styles.legendText}>East Coast</Text>
                        </View>

                        <View style={styles.legendItem}>
                            <View style={[styles.legendDot, { backgroundColor: '#C5E7D8' }]} />
                            <Text style={styles.legendText}>West End</Text>
                        </View>
                    </View>
                </View>

                {/* 5. Revenue Overview Card */}
                <View style={styles.sectionCard}>
                    <View style={styles.cardTitleHeader}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.cardTitle}>Revenue Overview</Text>
                            <Text style={styles.cardSubtitle}>Monthly recurring vs transactional revenue</Text>
                        </View>

                        {/* Legend Pills Top Right */}
                        <View style={styles.revLegendBox}>
                            <View style={styles.revLegendPill}>
                                <View style={[styles.smallDot, { backgroundColor: '#0B3B2C' }]} />
                                <Text style={styles.revLegendText}>Recurring</Text>
                            </View>
                            <View style={styles.revLegendPill}>
                                <View style={[styles.smallDot, { backgroundColor: '#A0522D' }]} />
                                <Text style={styles.revLegendText}>Transactional</Text>
                            </View>
                        </View>
                    </View>

                    {/* Stacked Bar Chart */}
                    <View style={styles.barChartWrapper}>
                        {/* Y-Axis Labels */}
                        <View style={styles.yAxisContainer}>
                            {['$140k', '$120k', '$100k', '$80k', '$60k', '$40k', '$20k', '$0k'].map((lbl, idx) => (
                                <Text key={idx} style={styles.axisLabel}>{lbl}</Text>
                            ))}
                        </View>

                        {/* Bar Plot Container */}
                        <View style={styles.barPlotArea}>
                            {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                                <View key={i} style={styles.gridLine} />
                            ))}

                            <View style={styles.barsContainer}>
                                {revenueData.map((bar, idx) => (
                                    <View key={idx} style={styles.singleBarCol}>
                                        <View style={styles.stackedBar}>
                                            <View
                                                style={[
                                                    styles.transactionalSegment,
                                                    { height: `${(bar.transactional / 140) * 100}%` }
                                                ]}
                                            />
                                            <View
                                                style={[
                                                    styles.recurringSegment,
                                                    { height: `${(bar.recurring / 140) * 100}%` }
                                                ]}
                                            />
                                        </View>
                                    </View>
                                ))}
                            </View>
                        </View>
                    </View>

                    {/* X-Axis Month Labels */}
                    <View style={styles.barXAxisRow}>
                        {revenueData.map((bar, idx) => (
                            <Text key={idx} style={styles.xAxisLabel}>{bar.month}</Text>
                        ))}
                    </View>
                </View>
            </ScrollView>

            {/* Bottom 4-Tab Admin Navigation */}
            <View style={styles.bottomNav}>
                {[
                    { id: 'Dashboard', label: 'Dashboard', icon: 'grid-outline', activeIcon: 'grid' },
                    { id: 'Listings', label: 'Listings', icon: 'home-outline', activeIcon: 'home' },
                    { id: 'Users', label: 'Users', icon: 'people-outline', activeIcon: 'people' },
                    { id: 'More', label: 'More', icon: 'options-outline', activeIcon: 'options' },
                ].map((tab) => {
                    const isActive = activeTab === tab.id;
                    return (
                        <TouchableOpacity
                            key={tab.id}
                            style={[styles.navItem, isActive && styles.navItemActive]}
                            onPress={() => onNavigateTab && onNavigateTab(tab.id)}
                            activeOpacity={0.8}
                        >
                            <Ionicons
                                name={isActive ? tab.activeIcon : tab.icon}
                                size={20}
                                color={isActive ? '#133E32' : '#64748B'}
                            />
                            <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
                                {tab.label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },

    /* Header */
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 14,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
        paddingTop: Platform.OS === 'android' ? 38 : 14,
    },
    leftSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    gridBox: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: '#E6F0EC',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: '#133E32',
    },
    bellBtn: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: '#F8FAFC',
        justifyContent: 'center',
        alignItems: 'center',
    },

    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 30,
        maxWidth: 600,
        width: '100%',
        alignSelf: 'center',
    },

    /* Title Section */
    titleSection: {
        marginBottom: 18,
    },
    pageTitle: {
        fontSize: 26,
        fontWeight: '900',
        color: '#0F172A',
        marginBottom: 4,
    },
    pageSubtitle: {
        fontSize: 13,
        color: '#64748B',
        fontWeight: '500',
    },

    /* 2x2 Metrics Grid */
    metricsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: 18,
    },
    metricCard: {
        width: '48%',
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.02,
        shadowRadius: 4,
        elevation: 1,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    metricLabel: {
        fontSize: 10,
        fontWeight: '800',
        color: '#64748B',
        letterSpacing: 0.5,
    },
    iconBox: {
        width: 28,
        height: 28,
        borderRadius: 8,
        backgroundColor: '#E6F0EC',
        justifyContent: 'center',
        alignItems: 'center',
    },
    metricValue: {
        fontSize: 26,
        fontWeight: '900',
        color: '#0F172A',
        marginBottom: 6,
    },
    trendRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    trendPct: {
        fontSize: 11,
        fontWeight: '800',
        color: '#133E32',
    },
    trendPctNegative: {
        color: '#DC2626',
    },
    trendPctNeutral: {
        color: '#64748B',
    },
    trendLabel: {
        fontSize: 10,
        color: '#64748B',
    },

    /* Cards */
    sectionCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 22,
        padding: 20,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginBottom: 18,
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 6,
        elevation: 2,
    },
    cardTitleHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: '#0F172A',
        marginBottom: 2,
    },
    cardSubtitle: {
        fontSize: 12,
        color: '#64748B',
        fontWeight: '500',
    },
    moreBtn: {
        padding: 4,
    },

    /* Line Chart */
    lineChartWrapper: {
        flexDirection: 'row',
        height: 180,
        marginTop: 10,
    },
    yAxisContainer: {
        justifyContent: 'space-between',
        paddingRight: 8,
        height: '100%',
    },
    axisLabel: {
        fontSize: 9,
        color: '#94A3B8',
        fontWeight: '600',
    },
    plotArea: {
        flex: 1,
        position: 'relative',
        height: '100%',
        justifyContent: 'space-between',
    },
    gridLine: {
        height: 1,
        backgroundColor: '#F1F5F9',
        width: '100%',
    },
    shadeArea: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '75%',
        backgroundColor: '#E6F0EC',
        opacity: 0.4,
        borderTopLeftRadius: 10,
        borderTopRightRadius: 10,
    },
    pointsOverlay: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 10,
        right: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    pointItem: {
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center',
    },
    pointDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#FFFFFF',
        borderWidth: 2.5,
        borderColor: '#0B3B2C',
    },
    xAxisRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingLeft: 40,
        paddingRight: 10,
        marginTop: 8,
    },
    xAxisLabel: {
        fontSize: 10,
        color: '#64748B',
        fontWeight: '600',
    },

    /* Donut Chart */
    donutWrapper: {
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 24,
    },
    outerDonut: {
        width: 150,
        height: 150,
        borderRadius: 75,
        backgroundColor: '#0B3B2C',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        position: 'relative',
    },
    donutRing1: {
        position: 'absolute',
        width: 150,
        height: 150,
        borderRadius: 75,
        borderTopWidth: 40,
        borderRightWidth: 40,
        borderColor: '#2A6B56',
    },
    donutRing2: {
        position: 'absolute',
        width: 150,
        height: 150,
        borderRadius: 75,
        borderBottomWidth: 35,
        borderLeftWidth: 35,
        borderColor: '#6FA893',
    },
    donutRing3: {
        position: 'absolute',
        width: 150,
        height: 150,
        borderRadius: 75,
        borderTopWidth: 20,
        borderLeftWidth: 20,
        borderColor: '#C5E7D8',
    },
    innerDonutHole: {
        width: 90,
        height: 90,
        borderRadius: 45,
        backgroundColor: '#FFFFFF',
    },

    legendGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 16,
        marginTop: 6,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '40%',
    },
    legendDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: 8,
    },
    legendText: {
        fontSize: 12,
        color: '#475569',
        fontWeight: '600',
    },

    /* Revenue Bar Chart */
    revLegendBox: {
        flexDirection: 'row',
        gap: 6,
    },
    revLegendPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    smallDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 4,
    },
    revLegendText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#475569',
    },

    barChartWrapper: {
        flexDirection: 'row',
        height: 180,
        marginTop: 10,
    },
    barPlotArea: {
        flex: 1,
        position: 'relative',
        height: '100%',
        justifyContent: 'space-between',
    },
    barsContainer: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 10,
        right: 10,
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'flex-end',
    },
    singleBarCol: {
        alignItems: 'center',
        height: '100%',
        justifyContent: 'flex-end',
    },
    stackedBar: {
        width: 24,
        height: '80%',
        justifyContent: 'flex-end',
        borderRadius: 6,
        overflow: 'hidden',
        backgroundColor: '#F1F5F9',
    },
    transactionalSegment: {
        width: '100%',
        backgroundColor: '#A0522D',
    },
    recurringSegment: {
        width: '100%',
        backgroundColor: '#0B3B2C',
    },
    barXAxisRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingLeft: 35,
        marginTop: 8,
    },

    /* Bottom Nav Bar */
    bottomNav: {
        flexDirection: 'row',
        height: 64,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
        paddingHorizontal: 10,
        alignItems: 'center',
    },
    navItem: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 6,
        borderRadius: 12,
    },
    navItemActive: {
        backgroundColor: '#E6F0EC',
    },
    navLabel: {
        fontSize: 10,
        fontWeight: '600',
        color: '#64748B',
        marginTop: 2,
    },
    navLabelActive: {
        color: '#133E32',
        fontWeight: '900',
    },
});
