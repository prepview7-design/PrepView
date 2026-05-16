const passport = require('passport');
const GoogleStrategy  = require('passport-google-oauth20').Strategy;
const TwitterStrategy = require('passport-twitter').Strategy;
const User = require('../models/User');

// ── Serialize / Deserialize (for session) ─────────────────
passport.serializeUser((user, done) => done(null, user.id));

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id).select('-password');
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

// ── Google Strategy ────────────────────────────────────────
passport.use(
  new GoogleStrategy(
    {
      clientID:     process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL:  '/api/auth/google/callback',
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user already exists with this Google ID
        let user = await User.findOne({ googleId: profile.id });

        if (!user) {
          // Check if email already registered (link accounts)
          const emailUser = await User.findOne({
            email: profile.emails[0].value,
          });

          if (emailUser) {
            // Link Google to existing account
            emailUser.googleId = profile.id;
            emailUser.avatar   = emailUser.avatar || profile.photos[0].value;
            await emailUser.save();
            return done(null, emailUser);
          }

          // Create brand new user
          user = await User.create({
            name:     profile.displayName,
            email:    profile.emails[0].value,
            googleId: profile.id,
            avatar:   profile.photos[0].value,
            provider: 'google',
          });
        }

        done(null, user);
      } catch (err) {
        done(err, null);
      }
    }
  )
);

// ── Twitter Strategy ───────────────────────────────────────
passport.use(
  new TwitterStrategy(
    {
      consumerKey:    process.env.TWITTER_CONSUMER_KEY,
      consumerSecret: process.env.TWITTER_CONSUMER_SECRET,
      callbackURL:    '/api/auth/twitter/callback',
      includeEmail:   true,
    },
    async (token, tokenSecret, profile, done) => {
      try {
        let user = await User.findOne({ twitterId: profile.id });

        if (!user) {
          user = await User.create({
            name:      profile.displayName,
            email:     profile.emails?.[0]?.value || null,
            twitterId: profile.id,
            avatar:    profile.photos[0].value.replace('_normal', '_400x400'),
            provider:  'twitter',
          });
        }

        done(null, user);
      } catch (err) {
        done(err, null);
      }
    }
  )
);