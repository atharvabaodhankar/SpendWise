import 'dart:convert';
import 'package:http/http.dart' as http;

/// Service that calls the existing Vercel /api/ai-chat endpoint.
class AiChatService {
  // In production, this should be your Vercel deployment URL.
  // During development, point to your local vercel dev server.
  static const String _baseUrl = 'https://spend-wise-pi.vercel.app';

  static Future<Map<String, dynamic>> sendMessage({
    required String message,
    required List<Map<String, String>> conversation,
    required Map<String, dynamic> context,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$_baseUrl/api/ai-chat'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'message': message,
          'conversation': conversation,
          'context': context,
        }),
      ).timeout(const Duration(seconds: 20));

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        final error = jsonDecode(response.body);
        throw Exception(error['error'] ?? 'AI request failed');
      }
    } catch (e) {
      throw Exception('Could not reach SpendWise AI: $e');
    }
  }
}
