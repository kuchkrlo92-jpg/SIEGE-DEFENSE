package com.example

import android.annotation.SuppressLint
import android.os.Bundle
import android.util.Log
import android.view.View
import android.view.ViewGroup
import android.webkit.RenderProcessGoneDetail
import android.webkit.WebChromeClient
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.viewinterop.AndroidView
import com.example.ui.theme.MyApplicationTheme

class MainActivity : ComponentActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    enableEdgeToEdge()
    setContent {
      MyApplicationTheme(darkTheme = true, dynamicColor = false) {
        Surface(
          modifier = Modifier.fillMaxSize(),
          color = MaterialTheme.colorScheme.background
        ) {
          TowerDefenseGameView(modifier = Modifier.fillMaxSize())
        }
      }
    }
  }
}

@SuppressLint("SetJavaScriptEnabled")
@Composable
fun TowerDefenseGameView(modifier: Modifier = Modifier) {
  AndroidView(
    modifier = modifier,
    factory = { context ->
      WebView(context).apply {
        layoutParams = ViewGroup.LayoutParams(
          ViewGroup.LayoutParams.MATCH_PARENT,
          ViewGroup.LayoutParams.MATCH_PARENT
        )
        setLayerType(View.LAYER_TYPE_SOFTWARE, null)
        settings.apply {
          javaScriptEnabled = true
          domStorageEnabled = true
          databaseEnabled = true
          useWideViewPort = true
          loadWithOverviewMode = true
          cacheMode = WebSettings.LOAD_NO_CACHE
          mediaPlaybackRequiresUserGesture = false
          setSupportZoom(false)
          allowFileAccess = true
          allowContentAccess = true
        }
        webViewClient = object : WebViewClient() {
          override fun onRenderProcessGone(view: WebView?, detail: RenderProcessGoneDetail?): Boolean {
            Log.w("TowerDefense", "Renderer process exited, recovering with software layer...")
            view?.let {
              it.setLayerType(View.LAYER_TYPE_SOFTWARE, null)
              it.loadUrl("file:///android_asset/index.html")
            }
            return true
          }
        }
        webChromeClient = WebChromeClient()
        loadUrl("file:///android_asset/index.html")
      }
    }
  )
}

