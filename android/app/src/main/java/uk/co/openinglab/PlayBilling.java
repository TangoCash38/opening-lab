package uk.co.openinglab;

import android.app.Activity;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;

import androidx.annotation.Nullable;

import com.android.billingclient.api.AcknowledgePurchaseParams;
import com.android.billingclient.api.BillingClient;
import com.android.billingclient.api.BillingClientStateListener;
import com.android.billingclient.api.BillingFlowParams;
import com.android.billingclient.api.BillingResult;
import com.android.billingclient.api.PendingPurchasesParams;
import com.android.billingclient.api.ProductDetails;
import com.android.billingclient.api.Purchase;
import com.android.billingclient.api.PurchasesUpdatedListener;
import com.android.billingclient.api.QueryProductDetailsParams;
import com.android.billingclient.api.QueryProductDetailsResult;
import com.android.billingclient.api.QueryPurchasesParams;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * Play Billing Library 8.x — Path B one-time INAPP only.
 * Pack SKU: pack_&lt;id with hyphens → underscores&gt; (qgd-black → pack_qgd_black).
 * Buy all SKU: buy_all_packs (not a lifetime licence).
 *
 * JavascriptInterface the site calls: OpeningLabPlay.buyPack(packId),
 * OpeningLabPlay.buyAll(), OpeningLabPlay.restorePurchases()
 * (restorePacks is an alias). Lab+ / SUBS is not launched.
 *
 * Digital Goods will not work in this raw System WebView.
 */
public class PlayBilling implements PurchasesUpdatedListener {

    public static final String BUY_ALL_SKU = "buy_all_packs";
    public static final String PACKAGE_NAME = "uk.co.openinglab";
    public static final String JS_NAME = "OpeningLabPlay";

    /**
     * Mirror of PLAY_PATH_B_PACK_IDS in src/lib/play-skus.ts.
     * 32 packs (includes caro-kann-black extras; excludes opening-traps).
     */
    static final String[] PATH_B_PACK_IDS = {
            "caro-kann-black",
            "qgd-black",
            "london-black",
            "d4-sidelines-black",
            "anti-sicilian-black",
            "nimzo-larsen-white",
            "italian-white",
            "ruy-white",
            "french-white",
            "alapin-white",
            "english-black",
            "kg-black",
            "scandinavian-white",
            "pirc-150-white",
            "dutch-fianchetto-white",
            "caro-advance-panov-white",
            "evans-black",
            "englund-white",
            "budapest-white",
            "bdg-black",
            "queens-gambit-white",
            "scotch",
            "english-white",
            "catalan-white",
            "nimzo-indian-black",
            "grunfeld-black",
            "petroff-black",
            "berlin-black",
            "kings-indian-black",
            "stafford-black",
            "ponziani-white",
            "alekhine-black",
    };

    private static final Set<String> PATH_B_SKUS;

    static {
        HashSet<String> skus = new HashSet<>();
        skus.add(BUY_ALL_SKU);
        for (String id : PATH_B_PACK_IDS) {
            skus.add("pack_" + id.replace('-', '_'));
        }
        PATH_B_SKUS = Collections.unmodifiableSet(skus);
    }

    private final Activity activity;
    @Nullable private WebView webView;
    @Nullable private BillingClient client;
    @Nullable private String pendingProductId;
    private boolean restoring;

    public PlayBilling(Activity activity) {
        this.activity = activity;
    }

    public void attach(WebView view) {
        this.webView = view;
        view.addJavascriptInterface(new Bridge(), JS_NAME);
        ensureClient();
        startConnection(null);
    }

    public void destroy() {
        webView = null;
        if (client != null) {
            try {
                client.endConnection();
            } catch (Exception ignored) {
            }
            client = null;
        }
    }

    public class Bridge {
        @JavascriptInterface
        public void buyPack(String packId) {
            final String sku = skuForPackId(packId);
            activity.runOnUiThread(() -> startBuy(sku));
        }

        @JavascriptInterface
        public void buyAll() {
            activity.runOnUiThread(() -> startBuy(BUY_ALL_SKU));
        }

        @JavascriptInterface
        public void restorePurchases() {
            activity.runOnUiThread(() -> startRestore());
        }

        @JavascriptInterface
        public void restorePacks() {
            activity.runOnUiThread(() -> startRestore());
        }
    }

    static String skuForPackId(@Nullable String packId) {
        if (packId == null) return "";
        String trimmed = packId.trim();
        if (trimmed.isEmpty()) return "";
        if (BUY_ALL_SKU.equals(trimmed)) return BUY_ALL_SKU;
        if (trimmed.startsWith("pack_")) {
            return PATH_B_SKUS.contains(trimmed) ? trimmed : "";
        }
        String sku = "pack_" + trimmed.replace('-', '_');
        return PATH_B_SKUS.contains(sku) ? sku : "";
    }

    static boolean isPathBSku(@Nullable String productId) {
        return productId != null && PATH_B_SKUS.contains(productId);
    }

    private void ensureClient() {
        if (client != null) return;
        client = BillingClient.newBuilder(activity)
                .setListener(this)
                .enablePendingPurchases(
                        PendingPurchasesParams.newBuilder()
                                .enableOneTimeProducts()
                                .build())
                .build();
    }

    private void startConnection(@Nullable Runnable then) {
        ensureClient();
        if (client == null) {
            emitError(restoring ? "restore" : "purchase", "NOT_READY", "Google Play Billing is not ready.");
            return;
        }
        if (client.isReady()) {
            if (then != null) then.run();
            return;
        }
        client.startConnection(new BillingClientStateListener() {
            @Override
            public void onBillingSetupFinished(BillingResult result) {
                if (result.getResponseCode() == BillingClient.BillingResponseCode.OK) {
                    if (then != null) then.run();
                    return;
                }
                emitBillingError(restoring ? "restore" : "purchase", result);
            }

            @Override
            public void onBillingServiceDisconnected() {
                // Next buy/restore reconnects.
            }
        });
    }

    private void startBuy(String productId) {
        restoring = false;
        if (productId == null || productId.isEmpty() || !isPathBSku(productId)) {
            emitError("purchase", "ITEM_UNAVAILABLE", "This pack isn’t on sale in the store yet");
            return;
        }
        pendingProductId = productId;
        startConnection(() -> queryAndLaunch(productId));
    }

    private void startRestore() {
        restoring = true;
        pendingProductId = null;
        startConnection(this::queryOwned);
    }

    private void queryAndLaunch(String productId) {
        if (client == null || !client.isReady()) {
            emitError("purchase", "NOT_READY", "Google Play Billing is not ready.");
            return;
        }
        ArrayList<QueryProductDetailsParams.Product> products = new ArrayList<>();
        products.add(
                QueryProductDetailsParams.Product.newBuilder()
                        .setProductId(productId)
                        .setProductType(BillingClient.ProductType.INAPP)
                        .build());
        QueryProductDetailsParams params = QueryProductDetailsParams.newBuilder()
                .setProductList(products)
                .build();
        client.queryProductDetailsAsync(params, (result, queryResult) -> {
            if (result.getResponseCode() != BillingClient.BillingResponseCode.OK) {
                emitBillingError("purchase", result);
                return;
            }
            ProductDetails details = findProduct(queryResult, productId);
            if (details == null) {
                emitError(
                        "purchase",
                        "ITEM_UNAVAILABLE",
                        "This pack isn’t on sale in the store yet");
                return;
            }
            ArrayList<BillingFlowParams.ProductDetailsParams> flowList = new ArrayList<>();
            BillingFlowParams.ProductDetailsParams.Builder row =
                    BillingFlowParams.ProductDetailsParams.newBuilder()
                            .setProductDetails(details);
            String offerToken = firstInAppOfferToken(details);
            if (offerToken != null) {
                row.setOfferToken(offerToken);
            }
            flowList.add(row.build());
            BillingFlowParams flow = BillingFlowParams.newBuilder()
                    .setProductDetailsParamsList(flowList)
                    .build();
            BillingResult launched = client.launchBillingFlow(activity, flow);
            if (launched.getResponseCode() == BillingClient.BillingResponseCode.ITEM_ALREADY_OWNED) {
                queryOwned();
                return;
            }
            if (launched.getResponseCode() != BillingClient.BillingResponseCode.OK) {
                emitBillingError("purchase", launched);
            }
        });
    }

    private void queryOwned() {
        if (client == null || !client.isReady()) {
            emitError(
                    restoring ? "restore" : "purchase",
                    "NOT_READY",
                    "Google Play Billing is not ready.");
            return;
        }
        QueryPurchasesParams params = QueryPurchasesParams.newBuilder()
                .setProductType(BillingClient.ProductType.INAPP)
                .build();
        client.queryPurchasesAsync(params, (result, purchases) -> {
            if (result.getResponseCode() != BillingClient.BillingResponseCode.OK) {
                emitBillingError(restoring ? "restore" : "purchase", result);
                return;
            }
            List<Purchase> owned = filterPathB(purchases);
            if (pendingProductId != null && !restoring) {
                Purchase match = findPurchase(owned, pendingProductId);
                if (match == null) {
                    emitError(
                            "purchase",
                            "NO_PURCHASES",
                            "This pack isn’t on sale in the store yet");
                    return;
                }
                acknowledgeThenEmit(listOf(match), "purchase");
                return;
            }
            if (owned.isEmpty()) {
                emitError(
                        restoring ? "restore" : "purchase",
                        "NO_PURCHASES",
                        restoring
                                ? "No Play pack purchase to restore."
                                : "This pack isn’t on sale in the store yet");
                return;
            }
            acknowledgeThenEmit(owned, restoring ? "restore" : "purchase");
        });
    }

    @Override
    public void onPurchasesUpdated(BillingResult result, @Nullable List<Purchase> purchases) {
        if (result.getResponseCode() == BillingClient.BillingResponseCode.USER_CANCELED) {
            emitError("purchase", "USER_CANCELED", "Purchase cancelled.");
            return;
        }
        if (result.getResponseCode() == BillingClient.BillingResponseCode.ITEM_ALREADY_OWNED) {
            queryOwned();
            return;
        }
        if (result.getResponseCode() != BillingClient.BillingResponseCode.OK) {
            emitBillingError("purchase", result);
            return;
        }
        List<Purchase> owned = filterPathB(purchases);
        if (pendingProductId != null) {
            Purchase match = findPurchase(owned, pendingProductId);
            if (match != null) {
                acknowledgeThenEmit(listOf(match), "purchase");
                return;
            }
        }
        if (owned.isEmpty()) {
            emitError("purchase", "NO_PURCHASES", "Google Play did not return a pack purchase.");
            return;
        }
        acknowledgeThenEmit(owned, "purchase");
    }

    private void acknowledgeThenEmit(List<Purchase> purchases, String action) {
        List<Purchase> granted = new ArrayList<>();
        for (Purchase purchase : purchases) {
            if (purchase.getPurchaseState() == Purchase.PurchaseState.PENDING) {
                continue;
            }
            if (purchase.getPurchaseState() != Purchase.PurchaseState.PURCHASED) {
                continue;
            }
            granted.add(purchase);
        }
        if (granted.isEmpty()) {
            emitError(action, "PENDING", "This purchase is still pending in Google Play.");
            return;
        }
        acknowledgeNext(granted, 0, action);
    }

    private void acknowledgeNext(List<Purchase> purchases, int index, String action) {
        if (index >= purchases.size()) {
            emitOk(action, purchases);
            return;
        }
        Purchase purchase = purchases.get(index);
        Runnable next = () -> acknowledgeNext(purchases, index + 1, action);
        if (purchase.isAcknowledged() || client == null) {
            next.run();
            return;
        }
        AcknowledgePurchaseParams ack = AcknowledgePurchaseParams.newBuilder()
                .setPurchaseToken(purchase.getPurchaseToken())
                .build();
        client.acknowledgePurchase(ack, result -> next.run());
    }

    @Nullable
    private static ProductDetails findProduct(
            @Nullable QueryProductDetailsResult queryResult,
            String productId) {
        if (queryResult == null) return null;
        List<ProductDetails> list = queryResult.getProductDetailsList();
        if (list == null) return null;
        for (ProductDetails details : list) {
            if (productId.equals(details.getProductId())) return details;
        }
        return null;
    }

    @Nullable
    private static String firstInAppOfferToken(ProductDetails details) {
        List<ProductDetails.OneTimePurchaseOfferDetails> many =
                details.getOneTimePurchaseOfferDetailsList();
        if (many != null && !many.isEmpty()) {
            String token = many.get(0).getOfferToken();
            if (token != null && !token.isEmpty()) return token;
        }
        ProductDetails.OneTimePurchaseOfferDetails one = details.getOneTimePurchaseOfferDetails();
        if (one == null) return null;
        String token = one.getOfferToken();
        return (token == null || token.isEmpty()) ? null : token;
    }

    private static List<Purchase> filterPathB(@Nullable List<Purchase> purchases) {
        ArrayList<Purchase> out = new ArrayList<>();
        if (purchases == null) return out;
        for (Purchase purchase : purchases) {
            List<String> ids = purchase.getProducts();
            if (ids == null) continue;
            for (String id : ids) {
                if (isPathBSku(id)) {
                    out.add(purchase);
                    break;
                }
            }
        }
        return out;
    }

    @Nullable
    private static Purchase findPurchase(List<Purchase> purchases, String productId) {
        for (Purchase purchase : purchases) {
            List<String> ids = purchase.getProducts();
            if (ids != null && ids.contains(productId)) return purchase;
        }
        return null;
    }

    private static List<Purchase> listOf(Purchase purchase) {
        ArrayList<Purchase> out = new ArrayList<>();
        out.add(purchase);
        return out;
    }

    private void emitBillingError(String action, BillingResult result) {
        int code = result.getResponseCode();
        if (code == BillingClient.BillingResponseCode.ITEM_UNAVAILABLE
                || code == BillingClient.BillingResponseCode.FEATURE_NOT_SUPPORTED) {
            emitError(action, "ITEM_UNAVAILABLE", "This pack isn’t on sale in the store yet");
            return;
        }
        if (code == BillingClient.BillingResponseCode.USER_CANCELED) {
            emitError(action, "USER_CANCELED", "Purchase cancelled.");
            return;
        }
        if (code == BillingClient.BillingResponseCode.BILLING_UNAVAILABLE) {
            emitError(action, "BILLING_UNAVAILABLE", "Google Play Billing isn’t available on this device.");
            return;
        }
        String debug = result.getDebugMessage();
        emitError(
                action,
                billingCodeName(code),
                (debug == null || debug.isEmpty())
                        ? "Google Play could not complete this purchase."
                        : debug);
    }

    private static String billingCodeName(int code) {
        switch (code) {
            case BillingClient.BillingResponseCode.FEATURE_NOT_SUPPORTED:
                return "FEATURE_NOT_SUPPORTED";
            case BillingClient.BillingResponseCode.SERVICE_DISCONNECTED:
                return "SERVICE_DISCONNECTED";
            case BillingClient.BillingResponseCode.SERVICE_UNAVAILABLE:
                return "SERVICE_UNAVAILABLE";
            case BillingClient.BillingResponseCode.BILLING_UNAVAILABLE:
                return "BILLING_UNAVAILABLE";
            case BillingClient.BillingResponseCode.ITEM_UNAVAILABLE:
                return "ITEM_UNAVAILABLE";
            case BillingClient.BillingResponseCode.DEVELOPER_ERROR:
                return "DEVELOPER_ERROR";
            case BillingClient.BillingResponseCode.ERROR:
                return "ERROR";
            case BillingClient.BillingResponseCode.ITEM_ALREADY_OWNED:
                return "ITEM_ALREADY_OWNED";
            case BillingClient.BillingResponseCode.ITEM_NOT_OWNED:
                return "ITEM_NOT_OWNED";
            case BillingClient.BillingResponseCode.NETWORK_ERROR:
                return "NETWORK_ERROR";
            default:
                return "ERROR";
        }
    }

    private void emitOk(String action, List<Purchase> purchases) {
        restoring = false;
        pendingProductId = null;
        if (purchases == null || purchases.isEmpty()) {
            emitError(action, "NO_PURCHASES", "Google Play did not return a pack purchase.");
            return;
        }
        Purchase first = purchases.get(0);
        String firstId = firstProductId(first);
        String token = first.getPurchaseToken() == null ? "" : first.getPurchaseToken();
        String order = first.getOrderId() == null ? "" : first.getOrderId();
        StringBuilder json = new StringBuilder();
        json.append("{\"ok\":true")
                .append(",\"action\":\"").append(jsonEscape(action)).append("\"")
                .append(",\"packageName\":\"").append(jsonEscape(PACKAGE_NAME)).append("\"")
                .append(",\"productId\":\"").append(jsonEscape(firstId)).append("\"")
                .append(",\"purchaseToken\":\"").append(jsonEscape(token)).append("\"")
                .append(",\"orderId\":\"").append(jsonEscape(order)).append("\"")
                .append(",\"purchases\":[");
        for (int i = 0; i < purchases.size(); i++) {
            if (i > 0) json.append(',');
            Purchase purchase = purchases.get(i);
            json.append("{\"productId\":\"").append(jsonEscape(firstProductId(purchase))).append("\"")
                    .append(",\"purchaseToken\":\"").append(jsonEscape(
                            purchase.getPurchaseToken() == null ? "" : purchase.getPurchaseToken()))
                    .append("\"")
                    .append(",\"orderId\":\"").append(jsonEscape(
                            purchase.getOrderId() == null ? "" : purchase.getOrderId()))
                    .append("\"}");
        }
        json.append("]}");
        emit(json.toString());
    }

    private static String firstProductId(Purchase purchase) {
        List<String> ids = purchase.getProducts();
        if (ids == null || ids.isEmpty()) return "";
        for (String id : ids) {
            if (isPathBSku(id)) return id;
        }
        return ids.get(0) == null ? "" : ids.get(0);
    }

    private void emitError(String action, String code, String message) {
        restoring = false;
        pendingProductId = null;
        emit("{\"ok\":false"
                + ",\"action\":\"" + jsonEscape(action) + "\""
                + ",\"code\":\"" + jsonEscape(code) + "\""
                + ",\"error\":\"" + jsonEscape(message) + "\"}");
    }

    private void emit(String json) {
        WebView view = webView;
        if (view == null) return;
        String script = "try{window.__openingLabPlayBilling&&window.__openingLabPlayBilling("
                + json + ")}catch(e){}";
        view.post(() -> view.evaluateJavascript(script, null));
    }

    private static String jsonEscape(String value) {
        if (value == null) return "";
        StringBuilder out = new StringBuilder(value.length() + 8);
        for (int i = 0; i < value.length(); i++) {
            char c = value.charAt(i);
            switch (c) {
                case '\\':
                    out.append("\\\\");
                    break;
                case '"':
                    out.append("\\\"");
                    break;
                case '\n':
                    out.append("\\n");
                    break;
                case '\r':
                    out.append("\\r");
                    break;
                case '\t':
                    out.append("\\t");
                    break;
                default:
                    if (c < 0x20) {
                        out.append(String.format("\\u%04x", (int) c));
                    } else {
                        out.append(c);
                    }
            }
        }
        return out.toString();
    }
}
