class AuthService {
  async register(data: any) {
    return {
      message: "Register service called",
      user: data,
    };
  }
}

export default new AuthService();