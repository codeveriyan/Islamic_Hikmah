import { useState, useMemo, useEffect } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView, TextInput, KeyboardAvoidingView, Platform, LayoutAnimation } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "@/src/ThemeContext";
import { theme } from "@/src/theme";

// Currency definitions with default gold/silver rates per gram
type CurrencyOption = {
  code: string;
  symbol: string;
  defaultGold: number;   // 24K per gram
  defaultSilver: number; // per gram
};

const CURRENCIES: CurrencyOption[] = [
  { code: "INR", symbol: "₹", defaultGold: 7500, defaultSilver: 90 },
  { code: "USD", symbol: "$", defaultGold: 90, defaultSilver: 1.1 },
  { code: "SAR", symbol: "SR", defaultGold: 330, defaultSilver: 4.1 },
  { code: "AED", symbol: "AED", defaultGold: 330, defaultSilver: 4.1 },
  { code: "GBP", symbol: "£", defaultGold: 70, defaultSilver: 0.85 },
  { code: "EUR", symbol: "€", defaultGold: 80, defaultSilver: 1.0 },
];

export default function ZakatCalculatorScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  // Currency state
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyOption>(CURRENCIES[0]);

  // Gold & Silver Rates state
  const [goldRate, setGoldRate] = useState(String(CURRENCIES[0].defaultGold));
  const [silverRate, setSilverRate] = useState(String(CURRENCIES[0].defaultSilver));

  // Gold unit (grams or tola)
  const [goldUnit, setGoldUnit] = useState<"grams" | "tola">("grams");
  const [silverUnit, setSilverUnit] = useState<"grams" | "tola">("grams");

  // Nisab selection
  const [nisabType, setNisabType] = useState<"silver" | "gold">("silver");

  // Accordion open states
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    rates: true,
    goldSilver: true,
    cashSavings: false,
    investments: false,
    business: false,
    liabilities: false,
  });

  // Assets: Gold & Silver weights
  const [gold24, setGold24] = useState("");
  const [gold22, setGold22] = useState("");
  const [gold21, setGold21] = useState("");
  const [gold18, setGold18] = useState("");
  const [silverWeight, setSilverWeight] = useState("");

  // Assets: Cash & Savings
  const [cashHand, setCashHand] = useState("");
  const [bankSavings, setBankSavings] = useState("");
  const [fixedDeposits, setFixedDeposits] = useState("");

  // Assets: Investments
  const [stocks, setStocks] = useState("");
  const [providentFund, setProvidentFund] = useState("");
  const [otherInvest, setOtherInvest] = useState("");

  // Assets: Business & Trade
  const [businessInventory, setBusinessInventory] = useState("");
  const [businessCash, setBusinessCash] = useState("");
  const [receivables, setReceivables] = useState("");
  const [otherAssets, setOtherAssets] = useState("");

  // Liabilities
  const [debts, setDebts] = useState("");
  const [bills, setBills] = useState("");

  const [loadingRates, setLoadingRates] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [ummahNisabInfo, setUmmahNisabInfo] = useState<{
    goldValue: number | null;
    silverValue: number | null;
    goldGrams: number;
    silverGrams: number;
  } | null>(null);

  const fetchLiveRates = async (currencyCode: string) => {
    setLoadingRates(true);
    try {
      const [goldRes, silverRes, ratesRes] = await Promise.all([
        fetch("https://api.gold-api.com/price/XAU").then(r => r.json()),
        fetch("https://api.gold-api.com/price/XAG").then(r => r.json()),
        fetch("https://open.er-api.com/v6/latest/USD").then(r => r.json())
      ]);

      if (goldRes?.price && silverRes?.price && ratesRes?.rates) {
        const goldUSD = goldRes.price;
        const silverUSD = silverRes.price;
        const exRate = ratesRes.rates[currencyCode] || 1;

        // 1 troy ounce = 31.1034768 grams
        const goldPerGramUSD = goldUSD / 31.1034768;
        const silverPerGramUSD = silverUSD / 31.1034768;

        const calculatedGoldRate = goldPerGramUSD * exRate;
        const calculatedSilverRate = silverPerGramUSD * exRate;

        setGoldRate(calculatedGoldRate.toFixed(2));
        setSilverRate(calculatedSilverRate.toFixed(2));
        
        const date = new Date();
        setLastUpdated(date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + " today");

        // Fetch live UmmahAPI Nisab threshold calculations
        try {
          const uNisabRes = await fetch(`https://www.ummahapi.com/api/zakat/nisab?gold_price_per_gram=${calculatedGoldRate.toFixed(2)}&silver_price_per_gram=${calculatedSilverRate.toFixed(2)}`);
          if (uNisabRes.ok) {
            const uData = await uNisabRes.json();
            if (uData?.data?.gold && uData?.data?.silver) {
              setUmmahNisabInfo({
                goldValue: uData.data.gold.monetary_value,
                silverValue: uData.data.silver.monetary_value,
                goldGrams: uData.data.gold.threshold_grams || 85,
                silverGrams: uData.data.silver.threshold_grams || 595,
              });
            }
          }
        } catch (uErr) {
          console.warn("UmmahAPI Nisab fetch error:", uErr);
        }
      }
    } catch (e) {
      console.warn("Could not fetch live rates, using defaults:", e);
    } finally {
      setLoadingRates(false);
    }
  };

  useEffect(() => {
    fetchLiveRates(selectedCurrency.code);
  }, []);

  // Change currency and auto-update rates
  const handleCurrencyChange = async (curr: CurrencyOption) => {
    setSelectedCurrency(curr);
    setGoldRate(String(curr.defaultGold));
    setSilverRate(String(curr.defaultSilver));
    await fetchLiveRates(curr.code);
  };

  const toggleSection = (section: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Unit conversion helper
  const toGrams = (weightStr: string, unit: "grams" | "tola") => {
    const weight = parseFloat(weightStr) || 0;
    return unit === "tola" ? weight * 11.664 : weight;
  };

  // Calculations
  const calculatedData = useMemo(() => {
    const activeGold = parseFloat(goldRate) || 0;
    const activeSilver = parseFloat(silverRate) || 0;

    // Gold value based on purity and weight
    const w24 = toGrams(gold24, goldUnit);
    const w22 = toGrams(gold22, goldUnit);
    const w21 = toGrams(gold21, goldUnit);
    const w18 = toGrams(gold18, goldUnit);

    const val24 = w24 * activeGold;
    const val22 = w22 * activeGold * (22 / 24);
    const val21 = w21 * activeGold * (21 / 24);
    const val18 = w18 * activeGold * (18 / 24);
    const totalGoldValue = val24 + val22 + val21 + val18;

    // Silver value
    const wSilver = toGrams(silverWeight, silverUnit);
    const totalSilverValue = wSilver * activeSilver;

    // Cash and Savings
    const cashVal = parseFloat(cashHand) || 0;
    const bankVal = parseFloat(bankSavings) || 0;
    const fdVal = parseFloat(fixedDeposits) || 0;
    const cashSavingsSum = cashVal + bankVal + fdVal;

    // Investments
    const stockVal = parseFloat(stocks) || 0;
    const pfVal = parseFloat(providentFund) || 0;
    const otherInvestVal = parseFloat(otherInvest) || 0;
    const investmentsSum = stockVal + pfVal + otherInvestVal;

    // Business
    const bizInvVal = parseFloat(businessInventory) || 0;
    const bizCashVal = parseFloat(businessCash) || 0;
    const receiveVal = parseFloat(receivables) || 0;
    const otherAssetVal = parseFloat(otherAssets) || 0;
    const businessSum = bizInvVal + bizCashVal + receiveVal + otherAssetVal;

    // Total Assets
    const totalAssetsVal = totalGoldValue + totalSilverValue + cashSavingsSum + investmentsSum + businessSum;

    // Liabilities
    const debtVal = parseFloat(debts) || 0;
    const billVal = parseFloat(bills) || 0;
    const totalLiabilitiesVal = debtVal + billVal;

    // Net Zakatable Wealth
    const netWealth = Math.max(0, totalAssetsVal - totalLiabilitiesVal);

    // Nisab Threshold: Gold = 87.48g, Silver = 612.36g
    const goldNisabLimit = 87.48 * activeGold;
    const silverNisabLimit = 612.36 * activeSilver;
    const activeNisabThreshold = nisabType === "gold" ? goldNisabLimit : silverNisabLimit;

    const isEligible = netWealth >= activeNisabThreshold;
    const zakatDue = isEligible ? netWealth * 0.025 : 0;

    return {
      totalGoldValue,
      totalSilverValue,
      cashSavingsSum,
      investmentsSum,
      businessSum,
      totalAssetsVal,
      totalLiabilitiesVal,
      netWealth,
      goldNisabLimit,
      silverNisabLimit,
      activeNisabThreshold,
      isEligible,
      zakatDue,
    };
  }, [
    goldRate, silverRate, goldUnit, silverUnit, nisabType,
    gold24, gold22, gold21, gold18, silverWeight,
    cashHand, bankSavings, fixedDeposits,
    stocks, providentFund, otherInvest,
    businessInventory, businessCash, receivables, otherAssets,
    debts, bills
  ]);

  const handleReset = () => {
    setGold24("");
    setGold22("");
    setGold21("");
    setGold18("");
    setSilverWeight("");
    setCashHand("");
    setBankSavings("");
    setFixedDeposits("");
    setStocks("");
    setProvidentFund("");
    setOtherInvest("");
    setBusinessInventory("");
    setBusinessCash("");
    setReceivables("");
    setOtherAssets("");
    setDebts("");
    setBills("");
    setGoldRate(String(selectedCurrency.defaultGold));
    setSilverRate(String(selectedCurrency.defaultSilver));
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.surface }]} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <MaterialCommunityIcons name="chevron-left" size={28} color={colors.onSurface} />
        </Pressable>
        <Text style={[styles.title, { color: colors.onSurface }]}>Zakat Calculator</Text>
        <Pressable onPress={handleReset} hitSlop={10}>
          <Text style={[styles.resetText, { color: colors.brand }]}>Reset</Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* Result Card */}
          <View style={[styles.resultCard, { backgroundColor: colors.brand + "15", borderColor: colors.brand }]}>
            <Text style={[styles.resultLabel, { color: colors.onSurfaceMuted }]}>Zakat Due (2.5%)</Text>
            <Text style={[styles.resultValue, { color: colors.brand }]}>
              {selectedCurrency.symbol}{calculatedData.zakatDue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
            
            <View style={styles.summaryRow}>
              <View style={styles.summaryCol}>
                <Text style={[styles.sumLabel, { color: colors.onSurfaceMuted }]}>Total Assets</Text>
                <Text style={[styles.sumVal, { color: colors.onSurface }]}>
                  {selectedCurrency.symbol}{calculatedData.totalAssetsVal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </Text>
              </View>
              <View style={styles.summaryCol}>
                <Text style={[styles.sumLabel, { color: colors.onSurfaceMuted }]}>Liabilities</Text>
                <Text style={[styles.sumVal, { color: colors.onSurface }]}>
                  {selectedCurrency.symbol}{calculatedData.totalLiabilitiesVal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </Text>
              </View>
              <View style={styles.summaryCol}>
                <Text style={[styles.sumLabel, { color: colors.onSurfaceMuted }]}>Net Wealth</Text>
                <Text style={[styles.sumVal, { color: colors.onSurface, fontWeight: "700" }]}>
                  {selectedCurrency.symbol}{calculatedData.netWealth.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </Text>
              </View>
            </View>

            <View style={[styles.nisabBadge, { backgroundColor: calculatedData.isEligible ? "#22c55e20" : colors.border }]}>
              <MaterialCommunityIcons
                name={calculatedData.isEligible ? "check-circle" : "alert-circle-outline"}
                size={16}
                color={calculatedData.isEligible ? "#22c55e" : colors.onSurfaceMuted}
              />
              <Text style={[styles.nisabBadgeText, { color: calculatedData.isEligible ? "#15803d" : colors.onSurfaceMuted }]}>
                {calculatedData.isEligible 
                  ? "Net wealth exceeds Nisab. Zakat is due." 
                  : `Net wealth is below Nisab (${selectedCurrency.symbol}${Math.round(calculatedData.activeNisabThreshold)}). No Zakat due.`}
              </Text>
            </View>
          </View>

          {/* Currency Select Buttons */}
          <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>Select Currency</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.currencyRow}>
            {CURRENCIES.map(curr => (
              <Pressable
                key={curr.code}
                onPress={() => handleCurrencyChange(curr)}
                style={[
                  styles.currencyBtn,
                  { borderColor: colors.border },
                  selectedCurrency.code === curr.code && { backgroundColor: colors.brand + "18", borderColor: colors.brand }
                ]}
              >
                <Text style={[styles.currencyBtnText, { color: selectedCurrency.code === curr.code ? colors.brand : colors.onSurface, fontWeight: selectedCurrency.code === curr.code ? "700" : "500" }]}>
                  {curr.code} ({curr.symbol})
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* 1. Metal Rates Accordion */}
          <Pressable onPress={() => toggleSection("rates")} style={[styles.accordionHeader, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
            <View style={styles.headerLeft}>
              <MaterialCommunityIcons name="currency-usd" size={22} color={colors.brand} />
              <Text style={[styles.accordionTitle, { color: colors.onSurface }]}>1. Gold &amp; Silver Rates</Text>
            </View>
            <MaterialCommunityIcons name={expandedSections.rates ? "chevron-up" : "chevron-down"} size={22} color={colors.onSurfaceMuted} />
          </Pressable>

          {expandedSections.rates && (
            <View style={[styles.accordionContent, { borderColor: colors.border }]}>
              {/* Live Status indicator */}
              <View style={styles.liveIndicatorRow}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <View style={[styles.liveDot, { backgroundColor: lastUpdated ? "#22c55e" : "#eab308" }]} />
                  <Text style={[styles.liveText, { color: colors.onSurfaceMuted }]}>
                    {loadingRates 
                      ? "Fetching latest market rates..." 
                      : lastUpdated 
                        ? `Live prices synced (${lastUpdated})` 
                        : "Using offline default rates"}
                  </Text>
                </View>
                <Pressable onPress={() => fetchLiveRates(selectedCurrency.code)} disabled={loadingRates} hitSlop={10}>
                  <Text style={{ fontSize: 12, color: colors.brand, fontWeight: "600" }}>
                    {loadingRates ? "Syncing..." : "Sync Live Rates"}
                  </Text>
                </Pressable>
              </View>

              <View style={styles.inputFieldRow}>
                <View style={styles.halfField}>
                  <Text style={[styles.inputLabel, { color: colors.onSurface }]}>Gold 24K per gram ({selectedCurrency.symbol})</Text>
                  <TextInput
                    value={goldRate}
                    onChangeText={setGoldRate}
                    keyboardType="numeric"
                    style={[styles.textInput, { color: colors.onSurface, borderColor: colors.border, backgroundColor: colors.surface }]}
                  />
                </View>
                <View style={styles.halfField}>
                  <Text style={[styles.inputLabel, { color: colors.onSurface }]}>Silver per gram ({selectedCurrency.symbol})</Text>
                  <TextInput
                    value={silverRate}
                    onChangeText={setSilverRate}
                    keyboardType="numeric"
                    style={[styles.textInput, { color: colors.onSurface, borderColor: colors.border, backgroundColor: colors.surface }]}
                  />
                </View>
              </View>

              <Text style={[styles.inputLabel, { color: colors.onSurface, marginTop: 12 }]}>Nisab Calculation Criteria</Text>
              <View style={styles.nisabRow}>
                <Pressable
                  onPress={() => setNisabType("silver")}
                  style={[
                    styles.nisabOption,
                    { borderColor: colors.border },
                    nisabType === "silver" && { backgroundColor: colors.brand + "18", borderColor: colors.brand }
                  ]}
                >
                  <MaterialCommunityIcons name="silverware-spoon" size={20} color={nisabType === "silver" ? colors.brand : colors.onSurfaceMuted} />
                  <Text style={[styles.nisabOptTitle, { color: colors.onSurface }]}>Silver Nisab (595g / 612.36g)</Text>
                  <Text style={[styles.nisabOptVal, { color: colors.onSurfaceMuted }]}>
                    {selectedCurrency.symbol}{Math.round(calculatedData.silverNisabLimit).toLocaleString()}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => setNisabType("gold")}
                  style={[
                    styles.nisabOption,
                    { borderColor: colors.border },
                    nisabType === "gold" && { backgroundColor: colors.brand + "18", borderColor: colors.brand }
                  ]}
                >
                  <MaterialCommunityIcons name="gold" size={20} color={nisabType === "gold" ? colors.brand : colors.onSurfaceMuted} />
                  <Text style={[styles.nisabOptTitle, { color: colors.onSurface }]}>Gold Nisab (85g / 87.48g)</Text>
                  <Text style={[styles.nisabOptVal, { color: colors.onSurfaceMuted }]}>
                    {selectedCurrency.symbol}{Math.round(calculatedData.goldNisabLimit).toLocaleString()}
                  </Text>
                </Pressable>
              </View>
            </View>
          )}

          {/* 2. Gold & Silver Section Accordion */}
          <Pressable onPress={() => toggleSection("goldSilver")} style={[styles.accordionHeader, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border, marginTop: 12 }]}>
            <View style={styles.headerLeft}>
              <MaterialCommunityIcons name="gold" size={22} color={colors.brand} />
              <Text style={[styles.accordionTitle, { color: colors.onSurface }]}>
                2. Gold &amp; Silver ({selectedCurrency.symbol}{Math.round(calculatedData.totalGoldValue + calculatedData.totalSilverValue).toLocaleString()})
              </Text>
            </View>
            <MaterialCommunityIcons name={expandedSections.goldSilver ? "chevron-up" : "chevron-down"} size={22} color={colors.onSurfaceMuted} />
          </Pressable>

          {expandedSections.goldSilver && (
            <View style={[styles.accordionContent, { borderColor: colors.border }]}>
              {/* Unit Toggles */}
              <View style={styles.unitToggleRow}>
                <Text style={[styles.inputLabel, { color: colors.onSurface }]}>Gold Unit:</Text>
                <View style={styles.unitGroup}>
                  <Pressable onPress={() => setGoldUnit("grams")} style={[styles.unitBtn, goldUnit === "grams" && { backgroundColor: colors.brand }]}>
                    <Text style={[styles.unitBtnText, { color: goldUnit === "grams" ? "#fff" : colors.onSurface }]}>Grams</Text>
                  </Pressable>
                  <Pressable onPress={() => setGoldUnit("tola")} style={[styles.unitBtn, goldUnit === "tola" && { backgroundColor: colors.brand }]}>
                    <Text style={[styles.unitBtnText, { color: goldUnit === "tola" ? "#fff" : colors.onSurface }]}>Tola</Text>
                  </Pressable>
                </View>
              </View>

              <View style={styles.gridFieldContainer}>
                <View style={styles.gridField}>
                  <Text style={[styles.inputLabel, { color: colors.onSurface }]}>Gold 24K weight</Text>
                  <TextInput
                    value={gold24}
                    onChangeText={setGold24}
                    keyboardType="numeric"
                    placeholder={`0 ${goldUnit}`}
                    placeholderTextColor={colors.onSurfaceMuted}
                    style={[styles.textInput, { color: colors.onSurface, borderColor: colors.border, backgroundColor: colors.surface }]}
                  />
                </View>
                <View style={styles.gridField}>
                  <Text style={[styles.inputLabel, { color: colors.onSurface }]}>Gold 22K weight</Text>
                  <TextInput
                    value={gold22}
                    onChangeText={setGold22}
                    keyboardType="numeric"
                    placeholder={`0 ${goldUnit}`}
                    placeholderTextColor={colors.onSurfaceMuted}
                    style={[styles.textInput, { color: colors.onSurface, borderColor: colors.border, backgroundColor: colors.surface }]}
                  />
                </View>
                <View style={styles.gridField}>
                  <Text style={[styles.inputLabel, { color: colors.onSurface }]}>Gold 21K weight</Text>
                  <TextInput
                    value={gold21}
                    onChangeText={setGold21}
                    keyboardType="numeric"
                    placeholder={`0 ${goldUnit}`}
                    placeholderTextColor={colors.onSurfaceMuted}
                    style={[styles.textInput, { color: colors.onSurface, borderColor: colors.border, backgroundColor: colors.surface }]}
                  />
                </View>
                <View style={styles.gridField}>
                  <Text style={[styles.inputLabel, { color: colors.onSurface }]}>Gold 18K weight</Text>
                  <TextInput
                    value={gold18}
                    onChangeText={setGold18}
                    keyboardType="numeric"
                    placeholder={`0 ${goldUnit}`}
                    placeholderTextColor={colors.onSurfaceMuted}
                    style={[styles.textInput, { color: colors.onSurface, borderColor: colors.border, backgroundColor: colors.surface }]}
                  />
                </View>
              </View>

              <View style={[styles.unitToggleRow, { marginTop: 12 }]}>
                <Text style={[styles.inputLabel, { color: colors.onSurface }]}>Silver Unit:</Text>
                <View style={styles.unitGroup}>
                  <Pressable onPress={() => setSilverUnit("grams")} style={[styles.unitBtn, silverUnit === "grams" && { backgroundColor: colors.brand }]}>
                    <Text style={[styles.unitBtnText, { color: silverUnit === "grams" ? "#fff" : colors.onSurface }]}>Grams</Text>
                  </Pressable>
                  <Pressable onPress={() => setSilverUnit("tola")} style={[styles.unitBtn, silverUnit === "tola" && { backgroundColor: colors.brand }]}>
                    <Text style={[styles.unitBtnText, { color: silverUnit === "tola" ? "#fff" : colors.onSurface }]}>Tola</Text>
                  </Pressable>
                </View>
              </View>

              <View style={styles.fieldContainer}>
                <Text style={[styles.inputLabel, { color: colors.onSurface }]}>Silver total weight</Text>
                <TextInput
                  value={silverWeight}
                  onChangeText={setSilverWeight}
                  keyboardType="numeric"
                  placeholder={`0 ${silverUnit}`}
                  placeholderTextColor={colors.onSurfaceMuted}
                  style={[styles.textInput, { color: colors.onSurface, borderColor: colors.border, backgroundColor: colors.surface }]}
                />
              </View>
            </View>
          )}

          {/* 3. Cash & Savings Accordion */}
          <Pressable onPress={() => toggleSection("cashSavings")} style={[styles.accordionHeader, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border, marginTop: 12 }]}>
            <View style={styles.headerLeft}>
              <MaterialCommunityIcons name="bank" size={22} color={colors.brand} />
              <Text style={[styles.accordionTitle, { color: colors.onSurface }]}>
                3. Cash &amp; Savings ({selectedCurrency.symbol}{Math.round(calculatedData.cashSavingsSum).toLocaleString()})
              </Text>
            </View>
            <MaterialCommunityIcons name={expandedSections.cashSavings ? "chevron-up" : "chevron-down"} size={22} color={colors.onSurfaceMuted} />
          </Pressable>

          {expandedSections.cashSavings && (
            <View style={[styles.accordionContent, { borderColor: colors.border }]}>
              <View style={styles.fieldContainer}>
                <Text style={[styles.inputLabel, { color: colors.onSurface }]}>Cash in Hand / At Home</Text>
                <TextInput
                  value={cashHand}
                  onChangeText={setCashHand}
                  keyboardType="numeric"
                  placeholder="0.00"
                  placeholderTextColor={colors.onSurfaceMuted}
                  style={[styles.textInput, { color: colors.onSurface, borderColor: colors.border, backgroundColor: colors.surface }]}
                />
              </View>

              <View style={styles.fieldContainer}>
                <Text style={[styles.inputLabel, { color: colors.onSurface }]}>Bank Accounts (Savings / Current)</Text>
                <TextInput
                  value={bankSavings}
                  onChangeText={setBankSavings}
                  keyboardType="numeric"
                  placeholder="0.00"
                  placeholderTextColor={colors.onSurfaceMuted}
                  style={[styles.textInput, { color: colors.onSurface, borderColor: colors.border, backgroundColor: colors.surface }]}
                />
              </View>

              <View style={styles.fieldContainer}>
                <Text style={[styles.inputLabel, { color: colors.onSurface }]}>Fixed Deposits / RD</Text>
                <TextInput
                  value={fixedDeposits}
                  onChangeText={setFixedDeposits}
                  keyboardType="numeric"
                  placeholder="0.00"
                  placeholderTextColor={colors.onSurfaceMuted}
                  style={[styles.textInput, { color: colors.onSurface, borderColor: colors.border, backgroundColor: colors.surface }]}
                />
              </View>
            </View>
          )}

          {/* 4. Investments Accordion */}
          <Pressable onPress={() => toggleSection("investments")} style={[styles.accordionHeader, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border, marginTop: 12 }]}>
            <View style={styles.headerLeft}>
              <MaterialCommunityIcons name="trending-up" size={22} color={colors.brand} />
              <Text style={[styles.accordionTitle, { color: colors.onSurface }]}>
                4. Investments ({selectedCurrency.symbol}{Math.round(calculatedData.investmentsSum).toLocaleString()})
              </Text>
            </View>
            <MaterialCommunityIcons name={expandedSections.investments ? "chevron-up" : "chevron-down"} size={22} color={colors.onSurfaceMuted} />
          </Pressable>

          {expandedSections.investments && (
            <View style={[styles.accordionContent, { borderColor: colors.border }]}>
              <View style={styles.fieldContainer}>
                <Text style={[styles.inputLabel, { color: colors.onSurface }]}>Stocks / Shares / Mutual Funds</Text>
                <TextInput
                  value={stocks}
                  onChangeText={setStocks}
                  keyboardType="numeric"
                  placeholder="0.00"
                  placeholderTextColor={colors.onSurfaceMuted}
                  style={[styles.textInput, { color: colors.onSurface, borderColor: colors.border, backgroundColor: colors.surface }]}
                />
              </View>

              <View style={styles.fieldContainer}>
                <Text style={[styles.inputLabel, { color: colors.onSurface }]}>Provident Fund (Accessible Amount Only)</Text>
                <TextInput
                  value={providentFund}
                  onChangeText={setProvidentFund}
                  keyboardType="numeric"
                  placeholder="0.00"
                  placeholderTextColor={colors.onSurfaceMuted}
                  style={[styles.textInput, { color: colors.onSurface, borderColor: colors.border, backgroundColor: colors.surface }]}
                />
              </View>

              <View style={styles.fieldContainer}>
                <Text style={[styles.inputLabel, { color: colors.onSurface }]}>Other Investments</Text>
                <TextInput
                  value={otherInvest}
                  onChangeText={setOtherInvest}
                  keyboardType="numeric"
                  placeholder="0.00"
                  placeholderTextColor={colors.onSurfaceMuted}
                  style={[styles.textInput, { color: colors.onSurface, borderColor: colors.border, backgroundColor: colors.surface }]}
                />
              </View>
            </View>
          )}

          {/* 5. Business Assets Accordion */}
          <Pressable onPress={() => toggleSection("business")} style={[styles.accordionHeader, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border, marginTop: 12 }]}>
            <View style={styles.headerLeft}>
              <MaterialCommunityIcons name="storefront-outline" size={22} color={colors.brand} />
              <Text style={[styles.accordionTitle, { color: colors.onSurface }]}>
                5. Business Assets ({selectedCurrency.symbol}{Math.round(calculatedData.businessSum).toLocaleString()})
              </Text>
            </View>
            <MaterialCommunityIcons name={expandedSections.business ? "chevron-up" : "chevron-down"} size={22} color={colors.onSurfaceMuted} />
          </Pressable>

          {expandedSections.business && (
            <View style={[styles.accordionContent, { borderColor: colors.border }]}>
              <View style={styles.fieldContainer}>
                <Text style={[styles.inputLabel, { color: colors.onSurface }]}>Business Inventory / Stock-in-Trade Value</Text>
                <TextInput
                  value={businessInventory}
                  onChangeText={setBusinessInventory}
                  keyboardType="numeric"
                  placeholder="0.00"
                  placeholderTextColor={colors.onSurfaceMuted}
                  style={[styles.textInput, { color: colors.onSurface, borderColor: colors.border, backgroundColor: colors.surface }]}
                />
              </View>

              <View style={styles.fieldContainer}>
                <Text style={[styles.inputLabel, { color: colors.onSurface }]}>Business Cash &amp; Bank Balances</Text>
                <TextInput
                  value={businessCash}
                  onChangeText={setBusinessCash}
                  keyboardType="numeric"
                  placeholder="0.00"
                  placeholderTextColor={colors.onSurfaceMuted}
                  style={[styles.textInput, { color: colors.onSurface, borderColor: colors.border, backgroundColor: colors.surface }]}
                />
              </View>

              <View style={styles.fieldContainer}>
                <Text style={[styles.inputLabel, { color: colors.onSurface }]}>Trade Receivables / Loans Given Out</Text>
                <TextInput
                  value={receivables}
                  onChangeText={setReceivables}
                  keyboardType="numeric"
                  placeholder="0.00"
                  placeholderTextColor={colors.onSurfaceMuted}
                  style={[styles.textInput, { color: colors.onSurface, borderColor: colors.border, backgroundColor: colors.surface }]}
                />
              </View>

              <View style={styles.fieldContainer}>
                <Text style={[styles.inputLabel, { color: colors.onSurface }]}>Other Business Assets</Text>
                <TextInput
                  value={otherAssets}
                  onChangeText={setOtherAssets}
                  keyboardType="numeric"
                  placeholder="0.00"
                  placeholderTextColor={colors.onSurfaceMuted}
                  style={[styles.textInput, { color: colors.onSurface, borderColor: colors.border, backgroundColor: colors.surface }]}
                />
              </View>
            </View>
          )}

          {/* 6. Liabilities Accordion */}
          <Pressable onPress={() => toggleSection("liabilities")} style={[styles.accordionHeader, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border, marginTop: 12 }]}>
            <View style={styles.headerLeft}>
              <MaterialCommunityIcons name="credit-card-minus-outline" size={22} color={colors.brand} />
              <Text style={[styles.accordionTitle, { color: colors.onSurface }]}>
                6. Liabilities ({selectedCurrency.symbol}{Math.round(calculatedData.totalLiabilitiesVal).toLocaleString()})
              </Text>
            </View>
            <MaterialCommunityIcons name={expandedSections.liabilities ? "chevron-up" : "chevron-down"} size={22} color={colors.onSurfaceMuted} />
          </Pressable>

          {expandedSections.liabilities && (
            <View style={[styles.accordionContent, { borderColor: colors.border }]}>
              <View style={styles.fieldContainer}>
                <Text style={[styles.inputLabel, { color: colors.onSurface }]}>Debts (Creditors / Loans to pay this year)</Text>
                <TextInput
                  value={debts}
                  onChangeText={setDebts}
                  keyboardType="numeric"
                  placeholder="0.00"
                  placeholderTextColor={colors.onSurfaceMuted}
                  style={[styles.textInput, { color: colors.onSurface, borderColor: colors.border, backgroundColor: colors.surface }]}
                />
              </View>

              <View style={styles.fieldContainer}>
                <Text style={[styles.inputLabel, { color: colors.onSurface }]}>Unpaid Bills, Taxes &amp; Dues Payable</Text>
                <TextInput
                  value={bills}
                  onChangeText={setBills}
                  keyboardType="numeric"
                  placeholder="0.00"
                  placeholderTextColor={colors.onSurfaceMuted}
                  style={[styles.textInput, { color: colors.onSurface, borderColor: colors.border, backgroundColor: colors.surface }]}
                />
              </View>
            </View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  title: { fontSize: 18, fontWeight: "700" },
  resetText: { fontSize: 15, fontWeight: "600" },
  scrollContent: {
    padding: theme.spacing.lg,
    paddingBottom: 48,
  },
  resultCard: {
    padding: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    borderWidth: 1.5,
    alignItems: "center",
    marginBottom: 20,
  },
  resultLabel: {
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  resultValue: {
    fontSize: 34,
    fontWeight: "900",
    marginVertical: 4,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.06)",
    marginBottom: 10,
  },
  summaryCol: {
    flex: 1,
    alignItems: "center",
  },
  sumLabel: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    marginBottom: 2,
  },
  sumVal: {
    fontSize: 14,
    fontWeight: "600",
  },
  nisabBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    width: "100%",
    justifyContent: "center",
  },
  nisabBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 8,
  },
  currencyRow: {
    flexDirection: "row",
    gap: 8,
    paddingBottom: 16,
  },
  currencyBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1.5,
    backgroundColor: "transparent",
  },
  currencyBtnText: {
    fontSize: 13,
  },
  accordionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
    borderRadius: theme.radius.md,
    borderWidth: 1,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  accordionTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  accordionContent: {
    borderWidth: 1,
    borderTopWidth: 0,
    borderBottomLeftRadius: theme.radius.md,
    borderBottomRightRadius: theme.radius.md,
    padding: theme.spacing.lg,
    backgroundColor: "transparent",
  },
  inputFieldRow: {
    flexDirection: "row",
    gap: 12,
  },
  halfField: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 6,
  },
  textInput: {
    height: 40,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    paddingHorizontal: 10,
    fontSize: 14,
  },
  nisabRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  nisabOption: {
    flex: 1,
    padding: 12,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    alignItems: "center",
  },
  nisabOptTitle: {
    fontSize: 12,
    fontWeight: "700",
    marginTop: 4,
    textAlign: "center",
  },
  nisabOptVal: {
    fontSize: 13,
    fontWeight: "700",
    marginTop: 4,
  },
  unitToggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  unitGroup: {
    flexDirection: "row",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.15)",
    overflow: "hidden",
  },
  unitBtn: {
    paddingVertical: 5,
    paddingHorizontal: 12,
  },
  unitBtnText: {
    fontSize: 11,
    fontWeight: "600",
  },
  gridFieldContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  gridField: {
    width: "48%",
    marginBottom: 8,
  },
  fieldContainer: {
    marginBottom: 12,
  },
  liveIndicatorRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  liveText: {
    fontSize: 12,
    fontWeight: "500",
  },
});
