# LOCi security portal - webapp

LOCi security portal webapp.

## Preview link to webapp

- LOCi: [`loci.goweki.com`](https://loci.goweki.com).

#### Public Pages

- Home: [`/`](https://loci.goweki.com/)
- Blog: [`/blog`](https://loci.goweki.com/blog)
- Contacts: [`/contacts`](https://loci.goweki.com/contacts)

#### User Pages

- User Home: [`/user`](https://loci.goweki.com/user)
- User Devices: [`/user/devices`](https://loci.goweki.com/user/devices)
- User Forum: [`/user/forum`](https://loci.goweki.com/user/forum)
- User Blog: [`/user/blog`](https://loci.goweki.com/blog)

#### Backend routes

- Authentication: [`/api/auth`] - authentication
- Mailing: [`/api/mailer`] - emailing function using nodemailer
- etc

## Toolchain

- Next js 14: bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).
- css: [`Tailwind`](https://tailwindcss.com/) v3.
- Hosting: [`Vercel`](https://vercel.com/).
- Mail: [`nodemailer`](https://nodemailer.com/).
- Authentication: [`Next.js Auth`](https://next-auth.js.org).

### Running App

1. Clone this repo in your local directory:

   ```bash
   git clone https://github.com/goweki/loci.git
   ```

2. Populate the environment variables as detailed in the `.env.template` file.

3. Navigate into the local repo and install dependencies:

   ```bash
   npm i
   ```

4. To seed data, run the `scripts/seed.mjs` script:

   ```bash
   npm run seed
   ```

5. To run the development server, within the cloned repo:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### To build the production-ready optimized build.

```bash
npm run build
```

- The output of the build process is stored in the `/.next` directory by default.

To start the server in production mode:

```bash
npm run start
```

- serves the previously built and optimized version of your application.
- Next js runs the server on port `3000` by default
