import { useMemo, useState, useEffect } from "react";
import {
  Alert,
  FlatList,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { theme } from "@/src/theme";
import { useTheme } from "@/src/ThemeContext";
import { useAuth } from "@/src/AuthContext";
import { usePremiumModal } from "@/src/PremiumModalContext";

type IngredientStatus = "unknown" | "mushbooh" | "haram";
type VerifyMode = "photo" | "barcode" | "text";

type IngredientRule = {
  term: string;
  status: IngredientStatus;
  reason: string;
};

type ScanResult = {
  id: string;
  productName: string;
  barcode: string;
  ingredients: string;
  verdict: IngredientStatus;
  matched: IngredientRule[];
  date: string;
  source?: string;
  confidence?: "low" | "medium";
};

const HISTORY_KEY = "hikmah:halal-scanner:history:v1";
const OCR_SPACE_API_KEY = process.env.EXPO_PUBLIC_OCR_SPACE_API_KEY || "helloworld";

const RULES: IngredientRule[] = [
  { term: "pork", status: "haram", reason: "Pork and pork-derived ingredients are not halal." },
  { term: "bacon", status: "haram", reason: "Bacon is normally pork-derived." },
  { term: "ham", status: "haram", reason: "Ham is normally pork-derived." },
  { term: "lard", status: "haram", reason: "Lard is rendered pig fat." },
  { term: "gelatin", status: "mushbooh", reason: "Gelatin may be from halal, beef, fish, or pork sources unless certified." },
  { term: "gelatine", status: "mushbooh", reason: "Gelatine source needs halal certification." },
  { term: "glycerin", status: "mushbooh", reason: "Glycerin can be plant, synthetic, or animal-derived." },
  { term: "glycerol", status: "mushbooh", reason: "Glycerol source should be verified." },
  { term: "mono and diglycerides", status: "mushbooh", reason: "Emulsifiers can be plant or animal-derived." },
  { term: "e471", status: "mushbooh", reason: "E471 may be plant or animal-derived." },
  { term: "e472", status: "mushbooh", reason: "E472 family may be plant or animal-derived." },
  { term: "rennet", status: "mushbooh", reason: "Rennet source may be animal, microbial, or vegetable." },
  { term: "enzymes", status: "mushbooh", reason: "Enzyme source should be checked with manufacturer/certifier." },
  { term: "whey", status: "mushbooh", reason: "Whey can be affected by the source of cheese enzymes." },
  { term: "carmine", status: "mushbooh", reason: "Carmine/cochineal is insect-derived and requires scholarly/certifier guidance." },
  { term: "cochineal", status: "mushbooh", reason: "Cochineal is insect-derived and commonly treated as questionable." },
  { term: "vanilla extract", status: "mushbooh", reason: "Vanilla extract often contains alcohol as a solvent." },
  { term: "alcohol", status: "haram", reason: "Alcohol as an intoxicant or added ingredient is not halal." },
  { term: "wine", status: "haram", reason: "Wine is alcoholic." },
  { term: "rum", status: "haram", reason: "Rum is alcoholic." },
  { term: "beer", status: "haram", reason: "Beer is alcoholic." },
  { term: "shellac", status: "mushbooh", reason: "Shellac is insect-derived and may need certification guidance." },
];

const CERTIFIED_TERMS = ["halal certified", "certified halal", "halal", "hfa", "ifanca", "muis", "jakim"];

const STATUS_META: Record<IngredientStatus, { label: string; color: string; icon: keyof typeof MaterialCommunityIcons.glyphMap }> = {
  unknown: { label: "Needs Verification", color: "#64748B", icon: "help-circle" },
  mushbooh: { label: "Questionable", color: "#F59E0B", icon: "alert-circle" },
  haram: { label: "Concerning Ingredient Found", color: "#DC2626", icon: "alert-circle" },
};

function normalize(text: string) {
  return text.toLowerCase().replace(/[()_,.;:/\\-]/g, " ").replace(/\s+/g, " ").trim();
}

/** Match a term using word boundaries so "alcohol" doesn't match inside "isopropyl alcohol" wrongly */
function matchesTerm(text: string, term: string): boolean {
  // Escape special regex chars in the term
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(?<![a-z])${escaped}(?![a-z])`, "i");
  return regex.test(text);
}

// Non-consumable alcohol terms — should NOT be flagged as haram
const NON_FOOD_ALCOHOL_TERMS = [
  "isopropyl alcohol",
  "denatured alcohol",
  "rubbing alcohol",
  "cetyl alcohol",      // fatty alcohol in cosmetics
  "stearyl alcohol",
  "cetearyl alcohol",
  "benzyl alcohol",     // preservative, not intoxicating
];

function analyzeIngredients(ingredients: string) {
  const normalized = normalize(ingredients);

  // Pre-filter: strip known non-food alcohol phrases so they don't trigger the "alcohol" rule
  let filteredText = normalized;
  for (const nonFood of NON_FOOD_ALCOHOL_TERMS) {
    filteredText = filteredText.split(nonFood).join("");
  }

  const matched = RULES.filter(rule => matchesTerm(filteredText, rule.term));
  const hasCertified = CERTIFIED_TERMS.some(term => matchesTerm(normalized, term));

  let verdict: IngredientStatus = "unknown";
  if (matched.some(item => item.status === "haram")) verdict = "haram";
  else if (matched.some(item => item.status === "mushbooh")) verdict = "mushbooh";

  return {
    verdict,
    matched,
    hasCertified,
    confidence: matched.length ? "medium" as const : "low" as const,
    source: "supplied product text",
  };
}

export default function HalalScannerScreen() {
  const router = useRouter();
  const { mode } = useLocalSearchParams<{ mode?: VerifyMode }>();
  const detailMode = mode === "photo" || mode === "barcode" || mode === "text" ? mode : null;
  const { colors } = useTheme();
  const { profile } = useAuth();
  const { showPremiumModal } = usePremiumModal();

  // Gate entire screen behind premium
  useEffect(() => {
    if (profile?.tier !== "premium" && !profile?.trialActive) {
      router.back();
      showPremiumModal("Halal Product Scanner");
    }
  }, [profile?.tier, profile?.trialActive]);
  const [productName, setProductName] = useState("");
  const [barcode, setBarcode] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [history, setHistory] = useState<ScanResult[]>([]);
  const [verifyMode, setVerifyMode] = useState<VerifyMode>("text");
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [scannerVisible, setScannerVisible] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);

  useEffect(() => {
    if (detailMode) setVerifyMode(detailMode);
  }, [detailMode]);

  useEffect(() => {
    AsyncStorage.getItem(HISTORY_KEY)
      .then(raw => {
        if (raw) setHistory(JSON.parse(raw));
      })
      .catch(() => {});
  }, []);

  const analysis = useMemo(() => analyzeIngredients(`${productName} ${barcode} ${ingredients}`), [productName, barcode, ingredients]);
  const meta = STATUS_META[analysis.verdict];

  const saveScan = async () => {
    if (!ingredients.trim() && !barcode.trim()) {
      Alert.alert("Add product details", "Enter a barcode or ingredients list to check the product.");
      return;
    }

    const item: ScanResult = {
      id: Date.now().toString(),
      productName: productName.trim() || "Unnamed product",
      barcode: barcode.trim(),
      ingredients: ingredients.trim(),
      verdict: analysis.verdict,
      matched: analysis.matched,
      date: new Date().toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      source: barcode ? "Barcode record / supplied ingredient text" : "Supplied ingredient text",
      confidence: analysis.confidence,
    };
    const next = [item, ...history].slice(0, 12);
    setHistory(next);
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  };

  const clearForm = () => {
    setProductName("");
    setBarcode("");
    setIngredients("");
  };

  const openHistoryItem = (item: ScanResult) => {
    setProductName(item.productName);
    setBarcode(item.barcode);
    setIngredients(item.ingredients);
  };

  const lookupBarcode = async (value = barcode.trim()) => {
    if (!value) {
      Alert.alert("Barcode required", "Scan or enter a barcode first.");
      return;
    }
    setLookupLoading(true);
    try {
      const fields = "product_name,ingredients_text,ingredients_text_en,brands";
      const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(value)}.json?fields=${fields}`);
      const data = await res.json();
      const product = data?.product;
      if (!product) {
        Alert.alert("Product not found", "No public product record was found. You can still paste ingredients manually.");
        return;
      }
      setProductName(product.product_name || product.brands || productName);
      setIngredients(product.ingredients_text_en || product.ingredients_text || ingredients);
    } catch {
      Alert.alert("Lookup failed", "Could not fetch product details. Please check your connection or paste ingredients manually.");
    } finally {
      setLookupLoading(false);
    }
  };

  const extractTextFromImage = async (uri: string) => {
    setOcrLoading(true);
    try {
      const base64 = await new FileSystem.File(uri).base64();
      const body = new URLSearchParams();
      body.append("apikey", OCR_SPACE_API_KEY);
      body.append("language", "eng");
      body.append("isOverlayRequired", "false");
      body.append("scale", "true");
      body.append("OCREngine", "2");
      body.append("base64Image", `data:image/jpeg;base64,${base64}`);

      const response = await fetch("https://api.ocr.space/parse/image", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
      });
      const payload = await response.json();
      const parsedText = payload?.ParsedResults?.map((item: any) => item?.ParsedText).filter(Boolean).join("\n").trim();

      if (!parsedText) {
        const message = payload?.ErrorMessage?.[0] || payload?.ErrorDetails || "No readable text was found. Try a clearer label photo.";
        Alert.alert("OCR could not read the label", String(message));
        return;
      }

      setIngredients(parsedText);
      Alert.alert("Ingredients extracted", "The label text was added below and checked automatically.");
    } catch {
      Alert.alert("OCR failed", "Could not extract text from the image. Try again or paste the ingredients manually.");
    } finally {
      setOcrLoading(false);
    }
  };

  const openBarcodeScanner = async () => {
    try {
      const permission = cameraPermission?.granted ? cameraPermission : await requestCameraPermission();
      if (!permission?.granted) {
        Alert.alert("Camera permission needed", "Allow camera access to scan product barcodes.");
        return;
      }
      setScannerVisible(true);
    } catch (err) {
      console.error("Failed to open barcode scanner:", err);
      Alert.alert("Error", "Could not open barcode scanner. Please check your camera settings.");
    }
  };

  const handleBarcodeScanned = ({ data }: BarcodeScanningResult) => {
    setScannerVisible(false);
    setVerifyMode("barcode");
    setBarcode(data);
    lookupBarcode(data).catch(() => {});
  };

  const pickLabelPhoto = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Photo permission needed", "Allow photo access to choose an ingredient label.");
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 0.85,
      });
      if (!result.canceled) {
        const uri = result.assets[0]?.uri || null;
        setPhotoUri(uri);
        if (uri) extractTextFromImage(uri).catch(() => {});
      }
    } catch (err) {
      console.error("Failed to pick image:", err);
      Alert.alert("Error", "Could not access photo library. Please try again.");
    }
  };

  const captureLabelPhoto = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Camera permission needed", "Allow camera access to capture ingredient labels.");
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        quality: 0.85,
      });
      if (!result.canceled) {
        const uri = result.assets[0]?.uri || null;
        setPhotoUri(uri);
        if (uri) extractTextFromImage(uri).catch(() => {});
      }
    } catch (err) {
      console.error("Failed to capture image:", err);
      Alert.alert("Error", "Could not start camera to capture photo. Please check your device settings.");
    }
  };

  const renderMatch = (item: IngredientRule) => {
    const itemMeta = STATUS_META[item.status];
    return (
      <View key={`${item.term}-${item.status}`} style={[styles.matchRow, { backgroundColor: itemMeta.color + "12", borderColor: itemMeta.color + "44" }]}>
        <MaterialCommunityIcons name={itemMeta.icon} size={18} color={itemMeta.color} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.matchTerm, { color: colors.onSurface }]}>{item.term.toUpperCase()}</Text>
          <Text style={[styles.matchReason, { color: colors.onSurfaceMuted }]}>{item.reason}</Text>
        </View>
      </View>
    );
  };

  const verifyCards: Array<{
    id: VerifyMode;
    title: string;
    subtitle: string;
    icon: keyof typeof MaterialCommunityIcons.glyphMap;
    colors: [string, string];
  }> = [
    {
      id: "photo",
      title: "Photo Scanning",
      subtitle: "Upload ingredient labels for OCR-ready analysis",
      icon: "camera-outline",
      colors: ["#3B82F6", "#7C3AED"],
    },
    {
      id: "barcode",
      title: "Barcode Lookup",
      subtitle: "Enter any barcode to check product details",
      icon: "line-scan",
      colors: ["#10B981", "#2DD4BF"],
    },
    {
      id: "text",
      title: "Text Input",
      subtitle: "Type or paste ingredients for detailed verification",
      icon: "file-document-outline",
      colors: ["#F97316", "#DB2777"],
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.surface }]} edges={["top"]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <MaterialCommunityIcons name="chevron-left" size={28} color={colors.onSurface} />
        </Pressable>
        <Text style={[styles.title, { color: colors.onSurface }]}>{detailMode ? `${detailMode.charAt(0).toUpperCase()}${detailMode.slice(1)} verification` : "Halal Food Scanner"}</Text>
        <Pressable onPress={() => router.push("/finder?type=halal" as any)} hitSlop={10}>
          <MaterialCommunityIcons name="map-marker-radius-outline" size={24} color={colors.brand} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {!detailMode && <LinearGradient
          colors={["#052e22", "#0f766e", "#d4af37"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.scannerIcon}>
            <MaterialCommunityIcons name="barcode-scan" size={34} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle}>Check ingredients instantly</Text>
            <Text style={styles.heroSub}>Paste the label or enter a barcode, then review halal, haram, and mushbooh flags.</Text>
          </View>
        </LinearGradient>}

        {!detailMode && <View>
          <Text style={[styles.verifyHeading, { color: colors.onSurface }]}>Multiple Ways to Verify</Text>
          <View style={styles.verifyGrid}>
            {verifyCards.map(card => {
              const active = verifyMode === card.id;
              return (
                <Pressable
                  key={card.id}
                  onPress={() => router.push({ pathname: "/halal-scanner", params: { mode: card.id } } as any)}
                  style={[
                    styles.verifyCard,
                    {
                      backgroundColor: colors.surfaceSecondary,
                      borderColor: active ? colors.brand : colors.border,
                      borderWidth: active ? 2 : 1,
                    },
                  ]}
                >
                  <LinearGradient colors={card.colors} style={styles.verifyIconBand}>
                    <MaterialCommunityIcons name={card.icon} size={34} color="#fff" />
                  </LinearGradient>
                  <View style={styles.verifyCardBody}>
                    <Text style={[styles.verifyTitle, { color: colors.onSurface }]}>{card.title}</Text>
                    <Text style={[styles.verifySub, { color: colors.onSurfaceMuted }]}>{card.subtitle}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>}

        <View style={[styles.panel, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>Product Details</Text>
          {verifyMode === "photo" && (
            <View style={[styles.photoDrop, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {photoUri ? (
                <Image source={{ uri: photoUri }} style={styles.photoPreview} />
              ) : (
                <MaterialCommunityIcons name="camera-plus-outline" size={32} color={colors.brand} />
              )}
              <Text style={[styles.photoTitle, { color: colors.onSurface }]}>Upload ingredient label</Text>
              <Text style={[styles.photoSub, { color: colors.onSurfaceMuted }]}>
                {ocrLoading ? "Extracting text from label..." : "Capture or choose a label photo. OCR will extract ingredients automatically."}
              </Text>
              <View style={styles.photoActions}>
                <Pressable onPress={captureLabelPhoto} style={[styles.miniBtn, { backgroundColor: colors.brand }]} disabled={ocrLoading}>
                  <Text style={[styles.miniBtnText, { color: colors.onBrandPrimary }]}>{ocrLoading ? "Reading..." : "Camera"}</Text>
                </Pressable>
                <Pressable onPress={pickLabelPhoto} style={[styles.miniBtn, { borderColor: colors.border, borderWidth: 1 }]} disabled={ocrLoading}>
                  <Text style={[styles.miniBtnText, { color: colors.onSurface }]}>Gallery</Text>
                </Pressable>
                {photoUri && (
                  <Pressable onPress={() => extractTextFromImage(photoUri)} style={[styles.miniBtn, { borderColor: colors.brand, borderWidth: 1 }]} disabled={ocrLoading}>
                    <Text style={[styles.miniBtnText, { color: colors.brand }]}>Re-read</Text>
                  </Pressable>
                )}
              </View>
            </View>
          )}
          <TextInput
            value={productName}
            onChangeText={setProductName}
            placeholder="Product name"
            placeholderTextColor={colors.onSurfaceMuted}
            style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.onSurface }]}
          />
          {verifyMode !== "text" && (
            <View style={styles.barcodeRow}>
              <TextInput
                value={barcode}
                onChangeText={setBarcode}
                placeholder="Barcode number"
                placeholderTextColor={colors.onSurfaceMuted}
                keyboardType="number-pad"
                style={[styles.barcodeInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.onSurface }]}
              />
              <Pressable onPress={openBarcodeScanner} style={[styles.squareBtn, { backgroundColor: colors.brand + "18", borderColor: colors.brand + "55" }]}>
                <MaterialCommunityIcons name="barcode-scan" size={22} color={colors.brand} />
              </Pressable>
              <Pressable onPress={() => lookupBarcode()} style={[styles.squareBtn, { backgroundColor: colors.brand }]} disabled={lookupLoading}>
                <MaterialCommunityIcons name={lookupLoading ? "loading" : "magnify"} size={22} color={colors.onBrandPrimary} />
              </Pressable>
            </View>
          )}
          <TextInput
            value={ingredients}
            onChangeText={setIngredients}
            placeholder={verifyMode === "barcode" ? "Ingredients from barcode lookup or package label..." : "Paste ingredients list..."}
            placeholderTextColor={colors.onSurfaceMuted}
            multiline
            textAlignVertical="top"
            style={[styles.ingredientsInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.onSurface }]}
          />
        </View>

        <View style={[styles.resultCard, { backgroundColor: meta.color + "14", borderColor: meta.color + "55" }]}>
          <MaterialCommunityIcons name={meta.icon} size={30} color={meta.color} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.resultLabel, { color: meta.color }]}>{meta.label}</Text>
            <Text style={[styles.resultCopy, { color: colors.onSurfaceMuted }]}>
              {analysis.matched.length === 0
                ? "No common concern was detected. Confirm the source and certification before relying on a product."
                : `${analysis.matched.length} ingredient flag${analysis.matched.length === 1 ? "" : "s"} found.`}
            </Text>
            <Text style={[styles.resultCopy, { color: colors.onSurfaceMuted, marginTop: 4 }]}>Ingredient assessment only ({analysis.confidence} confidence), not a halal certification or religious ruling.</Text>
            <Text style={[styles.resultCopy, { color: colors.onSurfaceMuted, marginTop: 4 }]}>Source: {analysis.source ?? "supplied product text"}. Certification claims are not independently verified.</Text>
          </View>
        </View>

        <View style={styles.actionRow}>
          <Pressable onPress={saveScan} style={[styles.primaryBtn, { backgroundColor: colors.brand }]}>
            <MaterialCommunityIcons name="content-save-outline" size={18} color={colors.onBrandPrimary} />
            <Text style={[styles.primaryText, { color: colors.onBrandPrimary }]}>Save Check</Text>
          </Pressable>
          <Pressable onPress={clearForm} style={[styles.secondaryBtn, { borderColor: colors.border }]}>
            <Text style={[styles.secondaryText, { color: colors.onSurface }]}>Clear</Text>
          </Pressable>
        </View>

        <View style={[styles.panel, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>Ingredient Flags</Text>
          {analysis.matched.length > 0 ? (
            analysis.matched.map(renderMatch)
          ) : (
            <Text style={[styles.emptyText, { color: colors.onSurfaceMuted }]}>Detected flags will appear here as you type.</Text>
          )}
        </View>

        <Pressable
          onPress={() => router.push("/finder?type=halal" as any)}
          style={[styles.finderLink, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}
        >
          <MaterialCommunityIcons name="food-fork-drink" size={22} color={colors.brand} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.finderTitle, { color: colors.onSurface }]}>Need a safe place to eat?</Text>
            <Text style={[styles.finderSub, { color: colors.onSurfaceMuted }]}>Open Halal Food Finder for nearby restaurants and meat shops.</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={22} color={colors.onSurfaceMuted} />
        </Pressable>

        {history.length > 0 && (
          <View style={[styles.panel, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>Recent Checks</Text>
            <FlatList
              data={history}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              renderItem={({ item }) => {
                const itemMeta = STATUS_META[item.verdict];
                return (
                  <Pressable onPress={() => openHistoryItem(item)} style={[styles.historyRow, { borderBottomColor: colors.border }]}>
                    <MaterialCommunityIcons name={itemMeta.icon} size={20} color={itemMeta.color} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.historyName, { color: colors.onSurface }]} numberOfLines={1}>{item.productName}</Text>
                      <Text style={[styles.historyMeta, { color: colors.onSurfaceMuted }]}>{itemMeta.label} - {item.date}</Text>
                    </View>
                  </Pressable>
                );
              }}
            />
          </View>
        )}

        <Text style={[styles.disclaimer, { color: colors.onSurfaceMuted }]}>
          This checker is a guide for common ingredients. Always rely on trusted halal certification or a qualified scholar for final decisions.
        </Text>
      </ScrollView>

      <Modal visible={scannerVisible} animationType="slide" onRequestClose={() => setScannerVisible(false)}>
        <SafeAreaView style={styles.cameraScreen} edges={["top"]}>
          <CameraView
            style={StyleSheet.absoluteFillObject}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e", "qr", "code128"] }}
            onBarcodeScanned={handleBarcodeScanned}
          />
          <View style={styles.cameraOverlay}>
            <View style={styles.scanFrame}>
              <View style={[styles.scanCorner, styles.scanCornerTl]} />
              <View style={[styles.scanCorner, styles.scanCornerTr]} />
              <View style={[styles.scanCorner, styles.scanCornerBl]} />
              <View style={[styles.scanCorner, styles.scanCornerBr]} />
            </View>
            <Text style={styles.cameraHelp}>Align the barcode inside the frame</Text>
            <Pressable onPress={() => setScannerVisible(false)} style={styles.cameraClose}>
              <MaterialCommunityIcons name="close" size={22} color="#fff" />
              <Text style={styles.cameraCloseText}>Close</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </Modal>
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
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: { fontSize: 18, fontWeight: "800" },
  content: { padding: theme.spacing.lg, gap: theme.spacing.md, paddingBottom: theme.spacing.xxxl },
  hero: { flexDirection: "row", gap: 14, borderRadius: 20, padding: 18, alignItems: "center" },
  scannerIcon: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroTitle: { color: "#fff", fontSize: 18, fontWeight: "900" },
  heroSub: { color: "rgba(255,255,255,0.82)", fontSize: 12, lineHeight: 18, marginTop: 4 },
  verifyHeading: { fontSize: 19, fontWeight: "900", marginBottom: 12 },
  verifyGrid: { gap: 12 },
  verifyCard: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  verifyIconBand: {
    height: 118,
    alignItems: "center",
    justifyContent: "center",
  },
  verifyCardBody: {
    padding: theme.spacing.lg,
  },
  verifyTitle: { fontSize: 16, fontWeight: "900" },
  verifySub: { fontSize: 13, lineHeight: 20, marginTop: 8 },
  panel: { borderRadius: 18, borderWidth: 1, padding: theme.spacing.lg, gap: 10 },
  sectionTitle: { fontSize: 15, fontWeight: "800", marginBottom: 2 },
  photoDrop: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: 14,
    minHeight: 128,
    alignItems: "center",
    justifyContent: "center",
    padding: theme.spacing.lg,
  },
  photoPreview: {
    width: "100%",
    height: 150,
    borderRadius: 12,
    marginBottom: 10,
  },
  photoTitle: { fontSize: 15, fontWeight: "900", marginTop: 8 },
  photoSub: { fontSize: 12, textAlign: "center", lineHeight: 18, marginTop: 4 },
  photoActions: { flexDirection: "row", gap: 10, marginTop: 12 },
  miniBtn: {
    minWidth: 92,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  miniBtnText: { fontSize: 12, fontWeight: "900" },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14 },
  barcodeRow: { flexDirection: "row", gap: 8 },
  barcodeInput: { flex: 1, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14 },
  squareBtn: {
    width: 48,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  ingredientsInput: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 14, minHeight: 130, lineHeight: 20 },
  resultCard: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 18, borderWidth: 1, padding: theme.spacing.lg },
  resultLabel: { fontSize: 18, fontWeight: "900" },
  resultCopy: { fontSize: 12, lineHeight: 18, marginTop: 2 },
  actionRow: { flexDirection: "row", gap: 10 },
  primaryBtn: { flex: 1, flexDirection: "row", gap: 8, alignItems: "center", justifyContent: "center", borderRadius: 14, paddingVertical: 14 },
  primaryText: { fontSize: 14, fontWeight: "800" },
  secondaryBtn: { width: 96, alignItems: "center", justifyContent: "center", borderRadius: 14, borderWidth: 1 },
  secondaryText: { fontSize: 14, fontWeight: "800" },
  matchRow: { flexDirection: "row", gap: 10, borderWidth: 1, borderRadius: 12, padding: 12 },
  matchTerm: { fontSize: 12, fontWeight: "900" },
  matchReason: { fontSize: 12, lineHeight: 17, marginTop: 2 },
  emptyText: { fontSize: 13, lineHeight: 19 },
  finderLink: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 18, borderWidth: 1, padding: theme.spacing.lg },
  finderTitle: { fontSize: 14, fontWeight: "800" },
  finderSub: { fontSize: 12, lineHeight: 17, marginTop: 2 },
  historyRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  historyName: { fontSize: 14, fontWeight: "800" },
  historyMeta: { fontSize: 12, marginTop: 2 },
  disclaimer: { fontSize: 11, lineHeight: 16, textAlign: "center", paddingHorizontal: 8 },
  cameraScreen: { flex: 1, backgroundColor: "#000" },
  cameraOverlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.24)",
    padding: theme.spacing.lg,
  },
  scanFrame: {
    width: "86%",
    height: 190,
    borderRadius: 24,
    position: "relative",
  },
  scanCorner: {
    position: "absolute",
    width: 42,
    height: 42,
    borderColor: "#fff",
  },
  scanCornerTl: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 18 },
  scanCornerTr: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 18 },
  scanCornerBl: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 18 },
  scanCornerBr: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 18 },
  cameraHelp: { color: "#fff", fontSize: 15, fontWeight: "800", marginTop: 22, textAlign: "center" },
  cameraClose: {
    position: "absolute",
    bottom: 34,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 999,
  },
  cameraCloseText: { color: "#fff", fontSize: 14, fontWeight: "800" },
});
