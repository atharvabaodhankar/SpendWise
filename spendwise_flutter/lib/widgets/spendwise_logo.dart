import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

/// SpendWise Logo widget matching the web app's SVG logo design.
class SpendWiseLogo extends StatelessWidget {
  final double size;
  final bool showBackground;
  final bool showText;
  final TextStyle? textStyle;

  const SpendWiseLogo({
    super.key,
    this.size = 36,
    this.showBackground = true,
    this.showText = false,
    this.textStyle,
  });

  @override
  Widget build(BuildContext context) {
    final logoIcon = Container(
      width: size,
      height: size,
      decoration: showBackground
          ? BoxDecoration(
              color: AppTheme.navy,
              borderRadius: BorderRadius.circular(size * 0.25),
            )
          : null,
      child: CustomPaint(
        size: Size(size, size),
        painter: _LogoPainter(size: size),
      ),
    );

    if (!showText) return logoIcon;

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        logoIcon,
        SizedBox(width: size * 0.3),
        Text(
          'SpendWise',
          style: textStyle ??
              TextStyle(
                fontSize: size * 0.45,
                fontWeight: FontWeight.bold,
                letterSpacing: -0.2,
                color: Theme.of(context).colorScheme.primary,
              ),
        ),
      ],
    );
  }
}

class _LogoPainter extends CustomPainter {
  final double size;

  _LogoPainter({required this.size});

  @override
  void paint(Canvas canvas, Size canvasSize) {
    final scale = size / 40.0;

    // 'S' curve in white
    final sPaint = Paint()
      ..color = Colors.white
      ..strokeWidth = 2.8 * scale
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round;

    final sPath = Path();
    // Path matching web SVG: M16.5 13.5C16.5 13.5 18 11 21.5 11C24.5 11 26.5 12.8 26.5 15C26.5 19.5 14 17.5 14 23.5C14 26 16 28.5 20 28.5C23.5 28.5 25.5 26.5 25.5 26.5
    sPath.moveTo(16.5 * scale, 13.5 * scale);
    sPath.cubicTo(16.5 * scale, 13.5 * scale, 18.0 * scale, 11.0 * scale, 21.5 * scale, 11.0 * scale);
    sPath.cubicTo(24.5 * scale, 11.0 * scale, 26.5 * scale, 12.8 * scale, 26.5 * scale, 15.0 * scale);
    sPath.cubicTo(26.5 * scale, 19.5 * scale, 14.0 * scale, 17.5 * scale, 14.0 * scale, 23.5 * scale);
    sPath.cubicTo(14.0 * scale, 26.0 * scale, 16.0 * scale, 28.5 * scale, 20.0 * scale, 28.5 * scale);
    sPath.cubicTo(23.5 * scale, 28.5 * scale, 25.5 * scale, 26.5 * scale, 25.5 * scale, 26.5 * scale);

    canvas.drawPath(sPath, sPaint);

    // 'W' accent in emerald green
    final wPaint = Paint()
      ..color = const Color(0xFF10B981)
      ..strokeWidth = 1.8 * scale
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round;

    final wPath = Path();
    // Path matching web SVG: M26 24L28 30L30.5 25L33 30
    wPath.moveTo(26.0 * scale, 24.0 * scale);
    wPath.lineTo(28.0 * scale, 30.0 * scale);
    wPath.lineTo(30.5 * scale, 25.0 * scale);
    wPath.lineTo(33.0 * scale, 30.0 * scale);

    canvas.drawPath(wPath, wPaint);

    // Decorative ledger dot
    final dotPaint = Paint()
      ..color = Colors.white.withAlpha((0.35 * 255).toInt())
      ..style = PaintingStyle.fill;

    canvas.drawCircle(Offset(10.0 * scale, 20.0 * scale), 1.5 * scale, dotPaint);
  }

  @override
  bool shouldRepaint(covariant _LogoPainter oldDelegate) => oldDelegate.size != size;
}
