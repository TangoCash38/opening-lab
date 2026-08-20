package uk.co.openinglab;

import android.app.Activity;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;

import android.annotation.Nullable;

import com.android.billingclient.api.AcknowledgePurchaseParams;
import com.android.billingclient.api.BillingClient;
import com.android.billingclient.api.BillingClientStateListener;
import com.android.billingclient.api.BillingFlowParams;
import com.android.billingclient.api.BillingResult;
import com.android.billingclient.api.ProductDetails;
import com.android.billingclient.api.Purchase;
import com.android.billingclient.api.PurchasesUpdatedListener;
import com.android.billingclient.api.QueryProductDetailsParams;
import com.android.billingclient.api.QueryPurchasesParams;

import java.util.ArrayList;
import java.util.List;

/**
 * Play Billing Library 7.x for Lab+ yearly only.
 * Digital Goods will not work in this raw System WebView — this is the
 * JavascriptInterface the site calls: OpeningLabPlay.buyLabPlusYearly()
 * and OpeningLabPlay.restoreLabPlus().
 *
 * Play Console product ID (subscription, yearly base plan, GBP): lab_plus_yearly
 */
public class PlayBilling implements PurchasesUpdatedListener {

    public static final String PRODUCT_ID = "lab_plus_yearly";
    public static final String PACKAGE_NAME = "uk.co.openinglab";
    public static final String JS_NAME = "OpeningLabPlay";

    private final Activity activity;
    @Nullable private WebView webView;
    @Nullable private BillingClient client;
    private boolean buying;
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
        public void buyLabPlusYearly() {
            activity.runOnUiThread(() -> startBuy());
        }

        @JavascriptInterface
        public void restoreLabPlus() {
            activity.runOnUiThread(() -> startRestore());
        }
    }

    private void ensureClient() {
        if (client != null) return;
        client = BillingClient.newBuilder(activity)
                .setListener(this)
                .enablePendingPurchases()
                .build();
    }

    private void startConnection(@Nullable Runnable then) {
        ensureClient();
        if (client == null) {
            emitError("purchase", "NOT_READY", "Google Play Billing is not ready.");
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

    private void startBuy() {
        buying = true;
        restoring = false;
        startConnection(this::queryAndLaunch);
    }

    private void startRestore() {
        restoring = true;
        buying = false;
        startConnection(this::queryOwned);
    }

    private void queryAndLaunch() {
        if (client == null || !client.isReady()) {
            emitError("purchase", "NOT_READY", "Google Play Billing is not ready.");
            return;
        }
        ArrayList<QueryProductDetailsParams.Product> products = new ArrayList<>();
        products.add(
                QueryProductDetailsParams.Product.newBuilder()
                        .setProductId(PRODUCT_ID)
                        .setProductType(BillingClient.ProductType.SUBS)
                        .build());
        QueryProductDetailsParams params = QueryProductDetailsParams.newBuilder()
                .setProductList(products)
                .build();
        client.queryProductDetailsAsync(params, (result, detailsList) -> {
            if (result.getResponseCode() != BillingClient.BillingResponseCode.OK) {
                emitBillingError("purchase", result);
                return;
            }
            ProductDetails details = findYearly(detailsList);
            if (details == null) {
                emitError(
                        "purchase",
                        "ITEM_UNAVAILABLE",
                        "Lab+ isn’t on sale in the store yet");
                return;
            }
            String offerToken = firstOfferToken(details);
            if (offerToken == null) {
                emitError(
                        "purchase",
                        "ITEM_UNAVAILABLE",
                        "Lab+ isn’t on sale in the store yet");
                return;
            }
            ArrayList<BillingFlowParams.ProductDetailsParams> flowList = new ArrayList<>();
            flowList.add(
                    BillingFlowParams.ProductDetailsParams.newBuilder()
                            .setProductDetails(details)
                            .setOfferToken(offerToken)
                            .build());
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
                .setProductType(BillingClient.ProductType.SUBS)
                .build();
        client.queryPurchasesAsync(params, (result, purchases) -> {
            if (result.getResponseCode() != BillingClient.BillingResponseCode.OK) {
                emitBillingError(restoring ? "restore" : "purchase", result);
                return;
            }
            Purchase match = findYearlyPurchase(purchases);
            if (match == null) {
                emitError(
                        restoring ? "restore" : "purchase",
                        "NO_PURCHASES",
                        restoring
                                ? "No Lab+ purchase to restore."
                                : "Lab+ isn’t on sale in the store yet");
                return;
            }
            acknowledgeThenEmit(match, restoring ? "restore" : "purchase");
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
        Purchase match = findYearlyPurchase(purchases);
        if (match == null) {
            emitError("purchase", "NO_PURCHASES", "Google Play did not return a Lab+ purchase.");
            return;
        }
        acknowledgeThenEmit(match, "purchase");
    }

    private void acknowledgeThenEmit(Purchase purchase, String action) {
        if (purchase.getPurchaseState() != Purchase.PurchaseState.PURCHASED) {
            emitError(action, "PENDING", "This purchase is still pending in Google Play.");
            return;
        }
        Runnable done = () -> emitOk(action, purchase);
        if (purchase.isAcknowledged() || client == null) {
            done.run();
            return;
        }
        AcknowledgePurchaseParams ack = AcknowledgePurchaseParams.newBuilder()
                .setPurchaseToken(purchase.getPurchaseToken())
                .build();
        client.acknowledgePurchase(ack, result -> done.run());
    }

    @Nullable
    private static ProductDetails findYearly(@Nullable List<ProductDetails> list) {
        if (list == null) return null;
        for (ProductDetails details : list) {
            if (PRODUCT_ID.equals(details.getProductId())) return details;
        }
        return null;
    }

    @Nullable
    private static String firstOfferToken(ProductDetails details) {
        List<ProductDetails.SubscriptionOfferDetails> offers = details.getSubscriptionOfferDetails();
        if (offers == null || offers.isEmpty()) return null;
        return offers.get(0).getOfferToken();
    }

    @Nullable
    private static Purchase findYearlyPurchase(@Nullable List<Purchase> purchases) {
        if (purchases == null) return null;
        for (Purchase purchase : purchases) {
            List<String> ids = purchase.getProducts();
            if (ids != null && ids.contains(PRODUCT_ID)) return purchase;
        }
        return null;
    }

    private void emitBillingError(String action, BillingResult result) {
        int code = result.getResponseCode();
        if (code == BillingClient.BillingResponseCode.ITEM_UNAVAILABLE
                || code == BillingClient.BillingResponseCode.FEATURE_NOT_SUPPORTED) {
            emitError(action, "ITEM_UNAVAILABLE", "Lab+ isn’t on sale in the store yet");
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

    private void emitOk(String action, Purchase purchase) {
        buying = false;
        restoring = false;
        String token = purchase.getPurchaseToken() == null ? "" : purchase.getPurchaseToken();
        String order = purchase.getOrderId() == null ? "" : purchase.getOrderId();
        emit("{\"ok\":true"
                + ",\"action\":\"" + jsonEscape(action) + "\""
                + ",\"packageName\":\"" + jsonEscape(PACKAGE_NAME) + "\""
                + ",\"productId\":\"" + jsonEscape(PRODUCT_ID) + "\""
                + ",\"purchaseToken\":\"" + jsonEscape(token) + "\""
                + ",\"orderId\":\"" + jsonEscape(order) + "\"}");
    }

    private void emitError(String action, String code, String message) {
        buying = false;
        restoring = false;
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
